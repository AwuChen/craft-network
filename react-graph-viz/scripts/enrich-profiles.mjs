#!/usr/bin/env node
/**
 * Batch-generate artistic profiles for Craft Network roster members.
 * Writes react-graph-viz/src/generatedProfiles.json (safe to commit — no API keys).
 *
 * Usage:
 *   cd react-graph-viz
 *   OPENAI_API_KEY=sk-... node scripts/enrich-profiles.mjs
 *   OPENAI_API_KEY=sk-... node scripts/enrich-profiles.mjs --limit=5
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
import { enrichPersonProfile } from '../src/profileEnrichment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../src/generatedProfiles.json');

function getLlmConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Set OPENAI_API_KEY');
  return {
    apiKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

function getNeo4jDriver() {
  const uri = process.env.NEO4J_URI || process.env.REACT_APP_NEO4J_URI;
  const user = process.env.NEO4J_USER || process.env.REACT_APP_NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || process.env.REACT_APP_NEO4J_PASSWORD;
  if (!uri || !password) throw new Error('Set NEO4J_URI and NEO4J_PASSWORD');
  return neo4j.driver(uri, neo4j.auth.basic(user, password));
}

async function fetchPeople(driver) {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (u:User)
      WHERE u.name IS NOT NULL AND NOT u.name STARTS WITH 'User-'
      RETURN u.name AS name,
             coalesce(u.role, '') AS role,
             coalesce(u.title, '') AS title,
             coalesce(u.location, '') AS location,
             coalesce(u.website, '') AS website
      ORDER BY u.name
    `);
    return result.records.map((r) => ({
      name: r.get('name'),
      role: r.get('role'),
      title: r.get('title'),
      location: r.get('location'),
      website: r.get('website'),
    }));
  } finally {
    await session.close();
  }
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
  const llmConfig = getLlmConfig();
  const driver = getNeo4jDriver();

  let existing = {};
  if (fs.existsSync(OUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  }

  const people = await fetchPeople(driver);
  const targets = limit ? people.slice(0, limit) : people;
  console.log(`Enriching ${targets.length} profiles…`);

  for (const person of targets) {
    if (existing[person.name]?.generatedAt) {
      console.log(`  skip (cached): ${person.name}`);
      continue;
    }
    try {
      console.log(`  generating: ${person.name}`);
      const profile = await enrichPersonProfile(person, llmConfig);
      existing[person.name] = {
        ...profile,
        generatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(OUT_PATH, `${JSON.stringify(existing, null, 2)}\n`);
    } catch (err) {
      console.error(`  failed: ${person.name} — ${err.message}`);
    }
  }

  await driver.close();
  console.log(`Done. Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
