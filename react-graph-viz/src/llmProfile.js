import { enrichPersonProfile } from './profileEnrichment';

function getLocalLlmConfig() {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_OPENAI_API_KEY. Add it to react-graph-viz/.env.local');
  }
  return {
    apiKey,
    model: process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini',
  };
}

function getProfileProxyUrl() {
  const cypherUrl = process.env.REACT_APP_LLM_PROXY_URL;
  if (!cypherUrl) return null;
  return cypherUrl.replace('/api/generate-cypher', '/api/generate-profile');
}

async function generateViaProxy(person) {
  const proxyUrl = getProfileProxyUrl();
  if (!proxyUrl) return null;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Profile proxy request failed (${response.status})`);
  }

  if (data.profile) {
    return { profile: data.profile, source: data.source || 'proxy' };
  }

  throw new Error('Profile proxy returned an invalid response');
}

export async function generatePersonProfile(person) {
  const proxyResult = await generateViaProxy(person);
  if (proxyResult) {
    return proxyResult;
  }

  const profile = await enrichPersonProfile(person, getLocalLlmConfig());
  return { profile, source: 'openai' };
}
