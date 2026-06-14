const DEFAULT_KEEPALIVE_MS = 30 * 60 * 1000; // 30 minutes

export async function pingNeo4j(driver) {
  const session = driver.session({ database: 'neo4j' });
  try {
    await session.run('RETURN 1 AS keepAlive');
  } finally {
    await session.close();
  }
}

export function startNeo4jKeepAlive(driver) {
  const configured = parseInt(process.env.REACT_APP_NEO4J_KEEPALIVE_MS, 10);
  const intervalMs = Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_KEEPALIVE_MS;

  const runPing = () => {
    pingNeo4j(driver).catch((err) => {
      console.warn('Neo4j keep-alive ping failed:', err.message || err);
    });
  };

  runPing();
  const intervalId = setInterval(runPing, intervalMs);

  return () => clearInterval(intervalId);
}
