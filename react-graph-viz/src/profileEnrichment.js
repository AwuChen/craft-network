/**
 * Generate artistic profile copy for Craft Network members.
 * Uses Tavily web search when available so profiles cite real sources.
 */

const GENERIC_NAMES = new Set([
  'alex', 'amy', 'john', 'friend', 'test', 'boston', 'chi', 'comfy', 'jb',
  'kelly', 'arnold', 'daniel', 'hannah', 'karl', 'gary', 'eli', 'erick',
]);

const BLOCKED_SUGGESTED_HOSTS = [
  'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com',
  'youtube.com', 'tiktok.com', 'pinterest.com',
];

function stripCodeFences(text) {
  if (!text) return '';
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

function parseProfileJson(raw) {
  const cleaned = stripCodeFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('LLM response was not valid JSON');
  }
}

export function scorePersonMatchConfidence(person) {
  const name = (person.name || '').trim();
  const role = (person.role || '').trim();
  const location = (person.location || '').trim();
  const website = (person.website || '').trim();

  if (!name || /^User-\d+$/.test(name)) return 0.1;

  let score = 0.3;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) score += 0.15;
  if (GENERIC_NAMES.has(name.toLowerCase())) score -= 0.3;
  if (role && !/^(affiliate|holder|new user|nfc|attendee)$/i.test(role)) score += 0.1;
  if (location) score += 0.05;
  if (website && website.startsWith('http')) score += 0.15;

  return Math.max(0, Math.min(1, score));
}

function nameTokens(name) {
  return (name || '')
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((t) => t.length > 2);
}

function pickSuggestedWebsite(sources, person) {
  if (person.website?.startsWith('http')) return person.website;

  const tokens = nameTokens(person.name);
  let best = null;
  let bestScore = 0;

  for (const source of sources) {
    try {
      const url = new URL(source.url);
      const host = url.hostname.replace(/^www\./, '');
      if (BLOCKED_SUGGESTED_HOSTS.some((h) => host.includes(h))) continue;

      const haystack = `${source.title} ${source.url} ${source.snippet}`.toLowerCase();
      let score = 0;
      tokens.forEach((token) => {
        if (haystack.includes(token)) score += 2;
      });
      if (person.role && haystack.includes(person.role.toLowerCase())) score += 1;
      if (person.location && haystack.includes(person.location.toLowerCase())) score += 1;

      if (score > bestScore) {
        bestScore = score;
        best = source.url;
      }
    } catch (_) {
      // skip invalid URLs
    }
  }

  return best || sources[0]?.url || '';
}

function dedupeSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    if (!source?.url || seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

function buildSearchQueries(person) {
  const { name, role, location } = person;
  const queries = [
    `${name} ${role} ${location}`.trim(),
    `"${name}" ${role} ${location}`.trim(),
    `${name} ${role} artist ${location}`.trim(),
    `${name} craftsman ${location}`.trim(),
  ];
  return [...new Set(queries.filter(Boolean))];
}

async function runTavilySearch(query, tavilyApiKey, options = {}) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyApiKey,
      query,
      search_depth: options.advanced ? 'advanced' : 'basic',
      max_results: options.maxResults || 5,
      include_answer: Boolean(options.includeAnswer),
      include_images: Boolean(options.includeImages),
      include_image_descriptions: Boolean(options.includeImages),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Web search failed (${response.status})`);
  }

  return response.json();
}

function mapTavilyResults(data) {
  return (data.results || []).map((result) => ({
    title: result.title || result.url,
    url: result.url,
    snippet: result.content || '',
    images: result.images || [],
  }));
}

export async function searchWebSources(person, tavilyApiKey) {
  if (!tavilyApiKey) {
    return { sources: [], status: 'missing_api_key', answer: '' };
  }

  const queries = buildSearchQueries(person);
  let answer = '';
  const batches = await Promise.all(
    queries.map(async (query, index) => {
      try {
        const data = await runTavilySearch(query, tavilyApiKey, {
          advanced: true,
          maxResults: 5,
          includeAnswer: index === 0,
        });
        if (index === 0 && data.answer) answer = data.answer;
        return mapTavilyResults(data);
      } catch (err) {
        console.warn(`Tavily query failed (${query}):`, err.message);
        return [];
      }
    }),
  );

  const sources = dedupeSources(batches.flat());
  return {
    sources,
    status: sources.length ? 'ok' : 'no_results',
    answer,
  };
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  const lower = url.toLowerCase();
  if (lower.includes('favicon') || lower.includes('logo.svg') || lower.includes('pixel')) return null;
  return url;
}

function collectImagesFromSearch(data, defaultCaption) {
  const images = [];
  const seen = new Set();

  const add = (url, caption, sourceUrl) => {
    const normalized = normalizeImageUrl(url);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    images.push({
      url: normalized,
      caption: caption || defaultCaption || '',
      sourceUrl: sourceUrl || '',
    });
  };

  for (const result of data.results || []) {
    for (const img of result.images || []) {
      if (typeof img === 'string') add(img, result.title, result.url);
      else if (img?.url) add(img.url, img.description || result.title, result.url);
    }
  }

  for (const img of data.images || []) {
    if (typeof img === 'string') add(img, defaultCaption, '');
  }

  return images;
}

export async function searchArtistImages(person, tavilyApiKey) {
  if (!tavilyApiKey) return [];

  const query = `"${person.name}" ${person.role} ${person.location}`.trim();
  try {
    const data = await runTavilySearch(query, tavilyApiKey, {
      advanced: true,
      maxResults: 4,
      includeImages: true,
    });
    return collectImagesFromSearch(data, person.name).slice(0, 3);
  } catch (_) {
    return [];
  }
}

export async function searchArtworkImages(person, tavilyApiKey) {
  if (!tavilyApiKey) return [];

  const query = `"${person.name}" ${person.role} artwork craft`.trim();
  try {
    const data = await runTavilySearch(query, tavilyApiKey, {
      advanced: true,
      maxResults: 5,
      includeImages: true,
    });
    return collectImagesFromSearch(data, `${person.name} — ${person.role}`).slice(0, 6);
  } catch (_) {
    return [];
  }
}

function buildProfilePrompt(person, searchSources, searchAnswer = '') {
  const sourceBlock = searchSources.length
    ? searchSources
        .map(
          (s, i) =>
            `[${i}] ${s.title}\n    URL: ${s.url}\n    Excerpt: ${s.snippet.slice(0, 400)}`,
        )
        .join('\n\n')
    : '(No web sources found — write minimal copy and set needsMoreInfo true.)';

  const answerBlock = searchAnswer
    ? `\nSearch summary (cross-check against source excerpts):\n${searchAnswer}\n`
    : '';

  return `You write profile pages for the Craft Network — a graph of craftsmen, artists, and collaborators.

Person (from NFC onboarding):
- name: ${person.name || ''}
- craft: ${person.role || ''}
- location: ${person.location || ''}
- website provided by user: ${person.website || '(none)'}

Web search results — ONLY use these for factual biographical claims:
${sourceBlock}
${answerBlock}

Respond with JSON only:
{
  "usedSourceIndices": [0, 1],
  "suggestedWebsite": "best official/personal site URL from sources, or empty string",
  "confidence": 0.0-1.0,
  "matchSummary": "one sentence: do the sources clearly match this person?",
  "tagline": "short line, max 12 words",
  "bio": "1-2 short paragraphs grounded in sources; if no sources, say verification is needed",
  "craftStatement": "one sentence about their craft",
  "highlights": ["2-4 bullets supported by sources or provided fields"],
  "needsMoreInfo": true or false
}

Rules:
- If sources do not clearly match this person, set needsMoreInfo true and confidence below 0.45
- Do NOT invent awards, employers, exhibitions, or quotes not in sources
- suggestedWebsite should be the artist's own site when visible in sources; avoid social media
- usedSourceIndices lists which search result numbers you relied on`;
}

async function callOpenAI(prompt, config) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a careful craft-network curator. Cite only verified sources. Output JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI request failed (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export function normalizeProfile(parsed, person, searchSources = [], searchStatus = 'ok') {
  const fieldScore = scorePersonMatchConfidence(person);
  const usedIndices = Array.isArray(parsed.usedSourceIndices)
    ? parsed.usedSourceIndices.filter((i) => Number.isInteger(i) && searchSources[i])
    : [];

  const citedSources = usedIndices.length
    ? usedIndices.map((i) => searchSources[i])
    : [];

  const allSources = searchSources.map((s, i) => ({
    title: s.title,
    url: s.url,
    snippet: s.snippet,
    cited: usedIndices.includes(i),
  }));

  let confidence = fieldScore;
  if (citedSources.length >= 2) confidence = Math.max(confidence, 0.75);
  else if (citedSources.length === 1) confidence = Math.max(confidence, 0.55);
  else if (!person.website && searchSources.length === 0) confidence = Math.min(confidence, 0.4);

  if (typeof parsed.confidence === 'number') {
    confidence = Math.min(confidence, parsed.confidence);
  }

  const suggestedWebsite =
    parsed.suggestedWebsite ||
    pickSuggestedWebsite(citedSources.length ? citedSources : searchSources, person) ||
    person.website ||
    '';

  const needsMoreInfo =
    searchStatus === 'missing_api_key' ||
    searchStatus === 'no_results' ||
    Boolean(parsed.needsMoreInfo) ||
    (citedSources.length === 0 && !person.website && searchSources.length === 0);

  if (needsMoreInfo) {
    confidence = Math.min(confidence, 0.44);
  }

  return {
    confidence,
    matchSummary:
      searchStatus === 'missing_api_key'
        ? 'Web search is not configured — set TAVILY_API_KEY on Render to look up artists like Google does.'
        : searchStatus === 'no_results'
          ? 'No matching public sources were found for this name and craft.'
          : parsed.matchSummary || '',
    tagline: parsed.tagline || '',
    bio: parsed.bio || '',
    craftStatement: parsed.craftStatement || '',
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : [],
    needsMoreInfo,
    sources: allSources,
    citedSources: citedSources.map((s) => ({ title: s.title, url: s.url, snippet: s.snippet })),
    suggestedWebsite,
    searchPerformed: searchSources.length > 0,
    searchStatus,
    artistImages: [],
    artworkImages: [],
  };
}

function buildMissingSearchProfile(person) {
  return attachImagesToProfile(
    {
      confidence: 0.1,
      matchSummary:
        'Web search is not configured — set TAVILY_API_KEY on Render to look up artists like Google does.',
      tagline: '',
      bio:
        'This profile could not be verified against the web. Add TAVILY_API_KEY to the Render proxy (craft-network-llm), then regenerate — or paste the artist\'s website manually below.',
      craftStatement: person.role ? `${person.name} works in ${person.role}.` : '',
      highlights: [],
      needsMoreInfo: true,
      sources: [],
      citedSources: [],
      suggestedWebsite: person.website || '',
      searchPerformed: false,
      searchStatus: 'missing_api_key',
    },
    [],
    [],
  );
}

export function attachImagesToProfile(profile, artistImages, artworkImages) {
  return {
    ...profile,
    artistImages: artistImages || [],
    artworkImages: artworkImages || [],
  };
}

export async function enrichPersonProfile(person, llmConfig) {
  const trimmed = {
    name: person.name?.trim() || '',
    role: person.role?.trim() || '',
    location: person.location?.trim() || '',
    website: person.website?.trim() || '',
  };

  if (!trimmed.name) {
    throw new Error('Name is required to generate a profile');
  }

  const searchResult = await searchWebSources(trimmed, llmConfig.tavilyApiKey);
  const { sources: searchSources, status: searchStatus, answer: searchAnswer } = searchResult;

  if (searchStatus === 'missing_api_key') {
    return buildMissingSearchProfile(trimmed);
  }

  const [artistImages, artworkImages] = await Promise.all([
    searchArtistImages(trimmed, llmConfig.tavilyApiKey).catch(() => []),
    searchArtworkImages(trimmed, llmConfig.tavilyApiKey).catch(() => []),
  ]);

  const raw = await callOpenAI(
    buildProfilePrompt(trimmed, searchSources, searchAnswer),
    llmConfig,
  );
  const profile = normalizeProfile(parseProfileJson(raw), trimmed, searchSources, searchStatus);
  return attachImagesToProfile(profile, artistImages, artworkImages);
}
