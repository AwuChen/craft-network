/**
 * Minimal LLM proxy for Craft Network (deploy to Render.com — no Vercel needed).
 * Keeps OpenAI/Anthropic keys off the GitHub Pages static bundle.
 */
import express from 'express';
import {
  generateCypherWithProvider,
  isRawCypherQuery,
  normalizeCypher,
  classifyQueryIntent,
} from '../src/llmShared.js';
import { enrichPersonProfile } from '../src/profileEnrichment.js';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'https://awuchen.github.io',
  'http://localhost:3000',
];

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://awuchen.github.io');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

function getServerProviderConfig() {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
    return {
      provider: 'anthropic',
      apiKey,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
  return {
    provider: 'openai',
    apiKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'craft-network-llm-proxy',
    health: '/api/health',
    generateCypher: 'POST /api/generate-cypher',
    generateProfile: 'POST /api/generate-profile',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'craft-network-llm-proxy',
    tavilyConfigured: Boolean(process.env.TAVILY_API_KEY),
  });
});

app.post('/api/generate-profile', async (req, res) => {
  try {
    const { person } = req.body || {};
    if (!person?.name?.trim()) {
      return res.status(400).json({ error: 'Missing person.name' });
    }
    const llmConfig = getServerProviderConfig();
    const profile = await enrichPersonProfile(person, {
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      tavilyApiKey: process.env.TAVILY_API_KEY,
    });
    res.json({ profile, source: llmConfig.provider });
  } catch (error) {
    console.error('generate-profile error:', error);
    res.status(500).json({ error: error.message || 'Profile generation failed' });
  }
});

app.post('/api/generate-cypher', async (req, res) => {
  try {
    const { question } = req.body || {};
    const trimmed = question?.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Missing question' });
    }
    if (isRawCypherQuery(trimmed)) {
      const cypher = normalizeCypher(trimmed);
      return res.json({
        cypher,
        intent: classifyQueryIntent(cypher),
        source: 'direct',
      });
    }
    const result = await generateCypherWithProvider(trimmed, getServerProviderConfig());
    res.json(result);
  } catch (error) {
    console.error('generate-cypher error:', error);
    res.status(500).json({ error: error.message || 'LLM proxy failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Craft Network LLM proxy listening on port ${PORT}`);
});
