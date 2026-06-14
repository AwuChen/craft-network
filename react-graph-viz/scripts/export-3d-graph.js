/**
 * Exports Craft Network graph data for craft-network-3d (static fallback).
 * Usage: NEO4J_URI=... NEO4J_PASSWORD=... node scripts/export-3d-graph.js [outputPath]
 */
const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');

const GRAPH_QUERY = `
MATCH (u:User)-[r:CONNECTED_TO]->(v:User)
RETURN u.name AS source,
       u.role AS sourceRole,
       u.title AS sourceTitle,
       u.website AS sourceWebsite,
       v.name AS target,
       v.role AS role,
       v.title AS title,
       v.website AS website
LIMIT $limit
`;

function buildGraph(records) {
  const nodesMap = new Map();
  const links = [];

  const addNode = (id, role, title, website) => {
    if (!id || nodesMap.has(id)) return;
    nodesMap.set(id, { id, name: id, role, title, website });
  };

  records.forEach((r) => {
    const source = r.get('source');
    const target = r.get('target');
    if (!source || !target) return;

    addNode(source, r.get('sourceRole'), r.get('sourceTitle'), r.get('sourceWebsite'));
    addNode(target, r.get('role'), r.get('title'), r.get('website'));
    links.push({ source, target });
  });

  return {
    nodes: Array.from(nodesMap.values()),
    links,
  };
}

async function main() {
  const uri = process.env.NEO4J_URI || process.env.REACT_APP_NEO4J_URI;
  const user = process.env.NEO4J_USER || process.env.REACT_APP_NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || process.env.REACT_APP_NEO4J_PASSWORD;

  if (!uri || !password) {
    console.error('Missing NEO4J_URI and NEO4J_PASSWORD (or REACT_APP_* equivalents)');
    process.exit(1);
  }

  const outputPath =
    process.argv[2] ||
    path.join(__dirname, '..', 'public', 'graph-data.json');

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session({ database: 'neo4j' });

  try {
    const result = await session.run(GRAPH_QUERY, { limit: neo4j.int(5000) });
    const graph = buildGraph(result.records);
    const payload = {
      exportedAt: new Date().toISOString(),
      ...graph,
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`Exported ${graph.nodes.length} nodes, ${graph.links.length} links → ${outputPath}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('3D graph export failed:', err.message || err);
  process.exit(1);
});
