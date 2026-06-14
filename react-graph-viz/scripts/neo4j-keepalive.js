/**
 * Standalone keep-alive ping for Neo4j Aura (CI/cron or manual run).
 * Usage: NEO4J_URI=... NEO4J_USER=... NEO4J_PASSWORD=... node scripts/neo4j-keepalive.js
 */
const neo4j = require('neo4j-driver');

async function main() {
  const uri = process.env.NEO4J_URI || process.env.REACT_APP_NEO4J_URI;
  const user = process.env.NEO4J_USER || process.env.REACT_APP_NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || process.env.REACT_APP_NEO4J_PASSWORD;

  if (!uri || !password) {
    console.error('Missing NEO4J_URI and NEO4J_PASSWORD (or REACT_APP_* equivalents)');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session({ database: 'neo4j' });

  try {
    const result = await session.run('RETURN 1 AS keepAlive, datetime() AS at');
    const row = result.records[0];
    console.log(`Neo4j keep-alive OK at ${row.get('at')}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Neo4j keep-alive failed:', err.message || err);
  process.exit(1);
});
