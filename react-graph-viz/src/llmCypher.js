import { generateCypherWithProvider, isRawCypherQuery, classifyQueryIntent, normalizeCypher } from './llmShared';

export { isRawCypherQuery, classifyQueryIntent };

function getLocalProviderConfig() {
  const provider = (process.env.REACT_APP_LLM_PROVIDER || 'openai').toLowerCase();
  if (provider === 'anthropic') {
    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing REACT_APP_ANTHROPIC_API_KEY. Add it to react-graph-viz/.env.local');
    }
    return {
      provider: 'anthropic',
      apiKey,
      model: process.env.REACT_APP_ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    };
  }

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_OPENAI_API_KEY. Add it to react-graph-viz/.env.local');
  }
  return {
    provider: 'openai',
    apiKey,
    model: process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini',
  };
}

async function generateViaProxy(question) {
  const proxyUrl = process.env.REACT_APP_LLM_PROXY_URL;
  if (!proxyUrl) {
    return null;
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `LLM proxy request failed (${response.status})`);
  }

  if (data.cypher && data.intent) {
    return {
      cypher: normalizeCypher(data.cypher),
      intent: data.intent,
      source: data.source || 'proxy',
    };
  }

  throw new Error('LLM proxy returned an invalid response');
}

export async function generateCypherFromNaturalLanguage(question) {
  const trimmed = question?.trim();
  if (!trimmed) {
    throw new Error('Enter a question or Cypher query');
  }

  if (isRawCypherQuery(trimmed)) {
    const cypher = normalizeCypher(trimmed);
    return { cypher, intent: classifyQueryIntent(cypher), source: 'direct' };
  }

  const proxyResult = await generateViaProxy(trimmed);
  if (proxyResult) {
    return proxyResult;
  }

  return generateCypherWithProvider(trimmed, getLocalProviderConfig());
}
