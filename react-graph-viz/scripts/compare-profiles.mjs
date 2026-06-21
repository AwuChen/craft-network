#!/usr/bin/env node
/**
 * Compare native web-search profiles (via proxy/local) against stored Neo4j profiles.
 * Does NOT write to Neo4j.
 *
 * Usage:
 *   npm run compare-profiles                  # top verified users via Render proxy
 *   npm run compare-profiles -- --limit=5
 *   npm run compare-profiles -- --local
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
import { enrichPersonProfile } from '../src/profileEnrichment.js';
import { formatCraftForDisplay } from '../src/userProfile.js';

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
  if (!apiKey) throw new Error('Set OPENAI_API_KEY or REACT_APP_OPENAI_API_KEY for --local');
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
    limit: limitArg ? parseInt(limitArg.split('=')[1], 10) : 12,
    local: process.argv.includes('--local'),
    delayMs: parseInt(process.env.ENRICH_DELAY_MS || '4000', 10),
  };
}

function parseJsonField(raw, fallback = []) {
  try {
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (_) {
    return fallback;
  }
}

function profileStats(profile) {
  const sources = profile?.sources || profile?.citedSources || [];
  const cited = profile?.citedSources?.length
    ?? sources.filter((s) => s.cited).length
    ?? sources.length;
  const images = profile?.artistImages?.length > 0 ? 1 : 0;
  return {
    confidence: Number(profile?.confidence || 0),
    sources: sources.length,
    cited,
    images,
    searchStatus: profile?.searchStatus || '',
    verified: cited >= 1 && Number(profile?.confidence || 0) >= 0.45,
    bioLen: (profile?.bio || '').length,
  };
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

async function fetchBaselineProfiles(driver, limit) {
  const session = driver.session({ database: 'neo4j' });
  try {
    const result = await session.run(
      `
      MATCH (u:User)
      WHERE u.name IS NOT NULL
        AND NOT u.name STARTS WITH 'User-'
        AND coalesce(u.profileVerified, false) = true
        AND coalesce(u.profileConfidence, 0) >= 0.45
      RETURN u.name AS name,
             coalesce(u.role, '') AS role,
             coalesce(u.title, '') AS title,
             coalesce(u.location, '') AS location,
             coalesce(u.website, '') AS website,
             coalesce(u.profileConfidence, 0) AS confidence,
             coalesce(u.profileSources, '[]') AS profileSources,
             coalesce(u.profileBio, '') AS bio,
             coalesce(u.profileArtistImages, '[]') AS artistImages,
             coalesce(u.profileArtworkImages, '[]') AS artworkImages
      ORDER BY u.profileConfidence DESC, u.name
      LIMIT $limit
      `,
      { limit: neo4j.int(limit) },
    );

    return result.records.map((r) => {
      const sources = parseJsonField(r.get('profileSources'));
      return {
        name: r.get('name'),
        role: r.get('role'),
        title: r.get('title'),
        location: r.get('location'),
        website: r.get('website'),
        stored: profileStats({
          confidence: r.get('confidence'),
          sources,
          citedSources: sources,
          bio: r.get('bio'),
          artistImages: parseJsonField(r.get('artistImages')).slice(0, 1),
          searchStatus: 'stored',
        }),
      };
    });
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
  if (!data.profile) throw new Error('Proxy returned no profile');
  return data.profile;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function winner(stored, generated) {
  const storedScore =
    stored.confidence * 2 + stored.cited + stored.images * 0.5 + (stored.verified ? 1 : 0);
  const genScore =
    generated.confidence * 2 + generated.cited + generated.images * 0.5 + (generated.verified ? 1 : 0);
  if (Math.abs(storedScore - genScore) < 0.25) return 'tie';
  return genScore > storedScore ? 'native' : 'stored';
}

async function main() {
  loadEnvLocal();
  const { limit, local, delayMs } = parseArgs();
  const driver = getNeo4jDriver();
  const llmConfig = local ? getLlmConfig() : null;
  const mode = local ? 'local keys' : `Render proxy (${getProxyUrl()})`;

  const baselines = await fetchBaselineProfiles(driver, limit);
  await driver.close();

  console.log(`Mode: ${mode}`);
  console.log(`Comparing ${baselines.length} stored verified profiles (read-only)\n`);
  console.log(
    'name | stored conf/src/img | native conf/src/img | winner',
  );
  console.log('-'.repeat(72));

  const rows = [];
  let nativeWins = 0;
  let storedWins = 0;
  let ties = 0;
  let failures = 0;

  for (let i = 0; i < baselines.length; i += 1) {
    const baseline = baselines[i];
    const payload = personPayload(baseline);
    const label = baseline.name;

    try {
      const profile = local
        ? await enrichPersonProfile(payload, llmConfig)
        : await generateViaProxy(payload);
      const generated = profileStats(profile);
      const result = winner(baseline.stored, generated);
      if (result === 'native') nativeWins += 1;
      else if (result === 'stored') storedWins += 1;
      else ties += 1;

      const s = baseline.stored;
      console.log(
        `${label} | ${s.confidence.toFixed(2)}/${s.cited}/${s.images} | ${generated.confidence.toFixed(2)}/${generated.cited}/${generated.images} (${generated.searchStatus}) | ${result}`,
      );

      rows.push({
        name: label,
        stored: s,
        native: generated,
        winner: result,
      });
    } catch (err) {
      failures += 1;
      console.log(`${label} | ${baseline.stored.confidence.toFixed(2)}/${baseline.stored.cited}/${baseline.stored.images} | ERROR: ${err.message}`);
      rows.push({ name: label, stored: baseline.stored, error: err.message });
    }

    if (i < baselines.length - 1) await sleep(delayMs);
  }

  console.log('\nSummary');
  console.log(`  native wins: ${nativeWins}`);
  console.log(`  stored wins: ${storedWins}`);
  console.log(`  ties:        ${ties}`);
  console.log(`  failures:    ${failures}`);

  const reportPath = path.join(__dirname, '../compare-profiles-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ mode, at: new Date().toISOString(), rows, summary: { nativeWins, storedWins, ties, failures } }, null, 2),
  );
  console.log(`\nReport: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
