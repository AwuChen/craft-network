module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'craft-network-llm-proxy',
    endpoints: {
      health: '/api/health',
      generateCypher: 'POST /api/generate-cypher',
    },
  });
};
