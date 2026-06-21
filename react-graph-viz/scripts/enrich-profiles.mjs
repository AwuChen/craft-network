#!/usr/bin/env node
/**
 * Batch-generate artistic profiles for all Craft Network users in Neo4j.
 *
 * Usage:
 *   cd react-graph-viz
 *   npm run enrich-profiles                    # all unverified users via Render proxy
 *   npm run enrich-profiles -- --limit=5       # test run
 *   npm run enrich-profiles -- --force         # regenerate verified profiles too
 *   npm run enrich-profiles -- --local         # use local OPENAI key instead
 *   npm run enrich-profiles -- --dry-run       # list targets only
 *
 * Default mode calls the Render LLM proxy (same keys as production search).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
import { enrichPersonProfile } from '../src/profileEnrichment.js';
import { formatCraftForDisplay, saveUserWithProfile } from '../src/userProfile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROXY =
  'https://craft-network-llm.onrender.com/api/generate-profile';

function loadEnvLocal() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function getLlmConfig() {
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.REACT_APP_OPENAI_API_KEY;

  if (!apiKey) throw new Error('Set OPENAI_API_KEY or REACT_APP_OPENAI_API_KEY (or use default Render proxy mode)');

  return {
    apiKey,
    model: process.env.OPENAI_MODEL || process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini',
    profileModel: process.env.OPENAI_PROFILE_MODEL || process.env.REACT_APP_OPENAI_PROFILE_MODEL,
  };
}

function getProxyUrl() {
  const fromEnv = process.env.LLM_PROXY_URL || process.env.REACT_APP_LLM_PROXY_URL;
  if (fromEnv) {
    return fromEnv.replace('/api/generate-cypher', '/api/generate-profile');
  }
  return DEFAULT_PROXY;
}

function getNeo4jDriver() {
  const uri =
    process.env.NEO4J_URI ||
    process.env.REACT_APP_NEO4J_URI ||
    'neo4j+s://7714be1a.databases.neo4j.io';
  const user = process.env.NEO4J_USER || process.env.REACT_APP_NEO4J_USER || 'neo4j';
  const password =
    process.env.NEO4J_PASSWORD ||
    process.env.REACT_APP_NEO4J_PASSWORD ||
    'lwW-hWpruNTNNrD-gCAMreXMZcUlAFcrjxmaeL94ZzM';
  return neo4j.driver(uri, neo4j.auth.basic(user, password));
}

function parseArgs() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  return {
    limit: limitArg ? parseInt(limitArg.split('=')[1], 10) : null,
    force: process.argv.includes('--force'),
    dryRun: process.argv.includes('--dry-run'),
    local: process.argv.includes('--local'),
    delayMs: parseInt(process.env.ENRICH_DELAY_MS || '3500', 10),
  };
}

function shouldVerify(profile, person) {
  if (profile.searchStatus === 'missing_api_key') return false;
  if (profile.citedSources?.length >= 1 && profile.confidence >= 0.45) return true;
  if (person.website && profile.searchStatus === 'ok' && profile.bio) return true;
  return false;
}

function personPayload(record) {
  const person = {
    name: record.name,
    role: record.role,
    title: record.title,
    location: record.location,
    website: record.website,
  };
  return {
    ...person,
    role: formatCraftForDisplay(person) || person.role || '',
    title: '',
  };
}

async function fetchPeople(driver) {
  const session = driver.session({ database: 'neo4j' });
  try {
    const result = await session.run(`
      MATCH (u:User)
      WHERE u.name IS NOT NULL AND NOT u.name STARTS WITH 'User-'
      RETURN u.name AS name,
             coalesce(u.role, '') AS role,
             coalesce(u.title, '') AS title,
             coalesce(u.location, '') AS location,
             coalesce(u.website, '') AS website,
             coalesce(u.profileVerified, false) AS profileVerified
      ORDER BY u.name
    `);
    return result.records.map((r) => ({
      name: r.get('name'),
      role: r.get('role'),
      title: r.get('title'),
      location: r.get('location'),
      website: r.get('website'),
      profileVerified: r.get('profileVerified'),
    }));
  } finally {
    await session.close();
  }
}

async function generateViaProxy(person) {
  const url = getProxyUrl();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Proxy failed (${response.status})`);
  }
  if (!data.profile) {
    throw new Error('Proxy returned no profile');
  }
  return data.profile;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  loadEnvLocal();
  const { limit, force, dryRun, local, delayMs } = parseArgs();
  const driver = getNeo4jDriver();
  const llmConfig = local ? getLlmConfig() : null;
  const mode = local ? 'local keys' : `Render proxy (${getProxyUrl()})`;

  const people = await fetchPeople(driver);
  let targets = force ? people : people.filter((p) => !p.profileVerified);
  if (limit) targets = targets.slice(0, limit);

  console.log(`Mode: ${mode}`);
  console.log(`Found ${people.length} users in Neo4j`);
  console.log(`Targets: ${targets.length}${force ? ' (force regenerate)' : ' (skip already verified)'}`);

  if (dryRun) {
    targets.forEach((p) => console.log(`  • ${p.name} — ${formatCraftForDisplay(p) || p.role || 'no craft'}`));
    await driver.close();
    return;
  }

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const record = targets[i];
    const payload = personPayload(record);
    const label = `[${i + 1}/${targets.length}] ${record.name}`;

    try {
      console.log(`${label} — generating…`);
      const profile = local
        ? await enrichPersonProfile(payload, llmConfig)
        : await generateViaProxy(payload);

      const verified = shouldVerify(profile, payload);
      const website = payload.website || profile.suggestedWebsite || '';

      await saveUserWithProfile(driver, {
        oldName: record.name,
        name: record.name,
        role: payload.role,
        location: payload.location,
        website,
        profile,
        verified,
      });

      const sourceCount = profile.citedSources?.length || profile.sources?.filter((s) => s.cited)?.length || 0;
      console.log(
        `${label} — saved (verified=${verified}, sources=${sourceCount}, confidence=${Number(profile.confidence || 0).toFixed(2)})`,
      );
      ok += 1;
    } catch (err) {
      console.error(`${label} — failed: ${err.message}`);
      failed += 1;
    }

    if (i < targets.length - 1) {
      await sleep(delayMs);
    }
  }

  await driver.close();
  console.log(`\nDone. saved=${ok}, failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
