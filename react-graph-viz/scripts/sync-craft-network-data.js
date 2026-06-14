/**
 * Regenerates src/craftNetworkData.js static fallback from live Neo4j.
 * Usage: NEO4J_URI=... NEO4J_PASSWORD=... node scripts/sync-craft-network-data.js
 */
const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');

const USERS_QUERY = `
MATCH (u:User)
WHERE u.name IS NOT NULL AND NOT u.name STARTS WITH 'User-'
RETURN u.name AS name,
       coalesce(u.role, '') AS role,
       coalesce(u.title, '') AS title,
       coalesce(u.location, '') AS location,
       coalesce(u.website, '') AS website
ORDER BY u.name
`;

const ROLES_QUERY = `
MATCH (u:User)
WHERE u.role IS NOT NULL AND trim(u.role) <> ''
RETURN DISTINCT u.role AS role
ORDER BY role
`;

function escapeString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatUserObject(user) {
  const parts = [`name: '${escapeString(user.name)}'`, `role: '${escapeString(user.role)}'`];
  if (user.title) parts.push(`title: '${escapeString(user.title)}'`);
  return `{ ${parts.join(', ')} }`;
}

function profileScore(user) {
  let score = 0;
  if (user.role) score += 2;
  if (user.title) score += 1;
  if (user.website) score += 3;
  if (user.location) score += 1;
  if (user.name === 'Awu Chen' && String(user.website).includes('awuchen')) score += 10;
  return score;
}

function dedupeUsers(users) {
  const byName = new Map();
  users.forEach((user) => {
    const existing = byName.get(user.name);
    if (!existing || profileScore(user) > profileScore(existing)) {
      byName.set(user.name, user);
    }
  });
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function pickAnchor(users) {
  const awuCandidates = users.filter((u) => u.name === 'Awu Chen');
  if (awuCandidates.length === 0) {
    return {
      name: 'Awu Chen',
      role: 'artist',
      title: 'digital craftsman',
      website: 'https://awuchen.github.io/',
    };
  }
  return awuCandidates.sort((a, b) => profileScore(b) - profileScore(a))[0];
}

function buildRosterContext(users, roles) {
  const knownUsers = dedupeUsers(users);
  const extraRoles = ['Affiliate', 'Holder', 'new user', 'NFC connect'];
  const mergedRoles = [...new Set([...roles, ...extraRoles])].sort();
  const craftsmen = knownUsers
    .filter((u) => String(u.role).toLowerCase().includes('craftsman'))
    .map((u) => u.name);

  return {
    knownUsers,
    roles: mergedRoles,
    craftsmen,
    anchor: pickAnchor(knownUsers),
  };
}

async function fetchRoster(driver) {
  const session = driver.session({ database: 'neo4j' });
  try {
    const usersRes = await session.run(USERS_QUERY);
    const rolesRes = await session.run(ROLES_QUERY);

    const rawUsers = usersRes.records.map((record) => ({
      name: record.get('name'),
      role: record.get('role') || '',
      title: record.get('title') || '',
      location: record.get('location') || '',
      website: record.get('website') || '',
    }));

    const rolesFromDb = rolesRes.records.map((record) => record.get('role'));
    return buildRosterContext(rawUsers, rolesFromDb);
  } finally {
    await session.close();
  }
}

function buildFileContent({ knownUsers, roles, craftsmen, anchor }) {
  const userLines = knownUsers.map((u) => `  ${formatUserObject(u)},`).join('\n');
  const roleLines = roles.map((r) => `'${escapeString(r)}'`).join(', ');

  return `// Auto-generated from live Neo4j on ${new Date().toISOString()}
// Re-run: npm run sync-roster

export const ANCHOR_NODE = {
  name: '${escapeString(anchor.name)}',
  role: '${escapeString(anchor.role || 'artist')}',
  title: '${escapeString(anchor.title || 'digital craftsman')}',
  website: '${escapeString(anchor.website || 'https://awuchen.github.io/')}',
};

export const NAME_ALIASES = {
  awu: 'Awu Chen',
  'awu chen': 'Awu Chen',
};

export const ROLES = [
  ${roleLines},
];

export const KNOWN_USERS = [
${userLines}
];

export const CRAFTSMEN = KNOWN_USERS
  .filter((u) => String(u.role).toLowerCase().includes('craftsman'))
  .map((u) => u.name);

let liveRosterContext = null;

export function setRosterContext(context) {
  liveRosterContext = context;
}

export function getRosterContext() {
  if (liveRosterContext) {
    return liveRosterContext;
  }
  return {
    knownUsers: KNOWN_USERS,
    roles: ROLES,
    craftsmen: CRAFTSMEN,
    anchor: ANCHOR_NODE,
    source: 'static',
  };
}

export function formatUserRosterForPrompt(context = getRosterContext()) {
  const lines = context.knownUsers.map(
    (u) => \`- \${u.name} (\${u.role}\${u.title ? \`, \${u.title}\` : ''})\`
  );
  return lines.join('\\n');
}

export function preprocessQuestion(question) {
  let q = question;
  q = q.replace(/\\bAwu\\b(?!\\s+Chen\\b)/gi, 'Awu Chen');
  return q;
}

export function postprocessCypher(cypher) {
  let q = cypher;
  q = q.replace(/toLower\\s*\\(\\s*[\\w.]+\\.name\\s*\\)\\s*CONTAINS\\s*toLower\\s*\\(\\s*['"]awu['"]\\s*\\)/gi, "a.name = 'Awu Chen'");
  q = q.replace(/toLower\\s*\\(\\s*[\\w.]+\\.name\\s*\\)\\s*CONTAINS\\s*['"]awu['"]/gi, "a.name = 'Awu Chen'");
  q = q.replace(/\\{\\s*name\\s*:\\s*['"]Awu['"]\\s*\\}/gi, "{name: 'Awu Chen'}");
  q = q.replace(/\\{\\s*name\\s*:\\s*['"]awu['"]\\s*\\}/gi, "{name: 'Awu Chen'}");
  q = q.replace(/MERGE\\s*\\(\\s*(\\w+)\\s*:\\s*User\\s*\\{\\s*name\\s*:\\s*['"]Awu['"]\\s*\\}\\s*\\)/gi, "MERGE ($1:User {name: 'Awu Chen'})");
  return q;
}

function profileScore(user) {
  let score = 0;
  if (user.role) score += 2;
  if (user.title) score += 1;
  if (user.website) score += 3;
  if (user.location) score += 1;
  if (user.name === 'Awu Chen' && String(user.website).includes('awuchen')) score += 10;
  return score;
}

function dedupeUsers(users) {
  const byName = new Map();
  users.forEach((user) => {
    const existing = byName.get(user.name);
    if (!existing || profileScore(user) > profileScore(existing)) {
      byName.set(user.name, user);
    }
  });
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function pickAnchor(users) {
  const awuCandidates = users.filter((u) => u.name === 'Awu Chen');
  if (awuCandidates.length === 0) {
    return ANCHOR_NODE;
  }
  return awuCandidates.sort((a, b) => profileScore(b) - profileScore(a))[0];
}

function buildRosterContext(users, roles) {
  const knownUsers = dedupeUsers(users);
  const extraRoles = ['Affiliate', 'Holder', 'new user', 'NFC connect'];
  const mergedRoles = [...new Set([...roles, ...extraRoles])].sort();
  const craftsmen = knownUsers
    .filter((u) => String(u.role).toLowerCase().includes('craftsman'))
    .map((u) => u.name);

  return {
    knownUsers,
    roles: mergedRoles,
    craftsmen,
    anchor: pickAnchor(knownUsers),
  };
}

export async function fetchLiveRoster(driver) {
  const session = driver.session({ database: 'neo4j' });
  try {
    const usersRes = await session.run(\`
MATCH (u:User)
WHERE u.name IS NOT NULL AND NOT u.name STARTS WITH 'User-'
RETURN u.name AS name,
       coalesce(u.role, '') AS role,
       coalesce(u.title, '') AS title,
       coalesce(u.location, '') AS location,
       coalesce(u.website, '') AS website
ORDER BY u.name
\`);
    const rolesRes = await session.run(\`
MATCH (u:User)
WHERE u.role IS NOT NULL AND trim(u.role) <> ''
RETURN DISTINCT u.role AS role
ORDER BY role
\`);

    const rawUsers = usersRes.records.map((record) => ({
      name: record.get('name'),
      role: record.get('role') || '',
      title: record.get('title') || '',
      location: record.get('location') || '',
      website: record.get('website') || '',
    }));

    const rolesFromDb = rolesRes.records.map((record) => record.get('role'));
    const roster = buildRosterContext(rawUsers, rolesFromDb);
    const context = {
      ...roster,
      source: 'live',
      fetchedAt: Date.now(),
    };

    setRosterContext(context);
    return context;
  } finally {
    await session.close();
  }
}
`;
}

async function main() {
  const uri = process.env.NEO4J_URI || process.env.REACT_APP_NEO4J_URI;
  const user = process.env.NEO4J_USER || process.env.REACT_APP_NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || process.env.REACT_APP_NEO4J_PASSWORD;

  if (!uri || !password) {
    console.error('Missing NEO4J_URI and NEO4J_PASSWORD');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  try {
    const roster = await fetchRoster(driver);
    const outPath = path.join(__dirname, '../src/craftNetworkData.js');
    fs.writeFileSync(outPath, buildFileContent(roster));
    console.log(`Wrote ${roster.knownUsers.length} users to ${outPath}`);
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
