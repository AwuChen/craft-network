/**
 * Server-side LLM proxy — keeps API keys off GitHub Pages.
 * Vercel Root Directory must be: react-graph-viz
 */

const ALLOWED_ORIGINS = [
  'https://awuchen.github.io',
  'http://localhost:3000',
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://awuchen.github.io');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getServerProviderConfig() {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY on server');
    }
    return {
      provider: 'anthropic',
      apiKey,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY on server');
  }
  return {
    provider: 'openai',
    apiKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { generateCypherWithProvider } = await import('../src/llmShared.js');
    const { question } = req.body || {};
    const result = await generateCypherWithProvider(question, getServerProviderConfig());
    return res.status(200).json(result);
  } catch (error) {
    console.error('generate-cypher error:', error);
    return res.status(500).json({ error: error.message || 'LLM proxy failed' });
  }
};
