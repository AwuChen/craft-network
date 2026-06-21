/**
 * Generate artistic profile copy for Craft Network members.
 * Uses OpenAI Responses API with native web_search (no Tavily).
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

function normalizeUrlKey(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch (_) {
    return (url || '').replace(/\/$/, '').toLowerCase();
  }
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  const lower = url.toLowerCase();
  if (lower.includes('favicon') || lower.includes('logo.svg') || lower.includes('pixel')) return null;
  return url;
}

function normalizeProfileImages(items, defaultCaption, limit = 6) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const url = typeof item === 'string' ? item : item?.url;
      const normalized = normalizeImageUrl(url);
      if (!normalized) return null;
      return {
        url: normalized,
        caption: (typeof item === 'object' && item.caption) || defaultCaption || '',
        sourceUrl: (typeof item === 'object' && item.sourceUrl) || '',
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function buildNativeSearchPrompt(person) {
  return `You are building a profile page for the Craft Network — a graph of craftsmen, artists, and collaborators.

Search the web for this person and verify you have the right individual before writing copy.

Person (from NFC onboarding):
- name: ${person.name || ''}
- craft: ${person.role || '(unknown)'}
- location: ${person.location || '(unknown)'}
- website provided by user: ${person.website || '(none)'}

Suggested searches: "${person.name}" ${person.role} ${person.location}; "${person.name}" artist craftsman ${person.location}.

After searching, respond with JSON only (no markdown fences):
{
  "usedSourceUrls": ["https://..."],
  "suggestedWebsite": "official/personal site URL or empty string",
  "confidence": 0.0-1.0,
  "matchSummary": "one sentence: do sources clearly match this person?",
  "tagline": "short line, max 12 words",
  "bio": "1-2 short paragraphs grounded in search results",
  "craftStatement": "one sentence about their craft",
  "highlights": ["2-4 bullets supported by sources"],
  "needsMoreInfo": true or false,
  "portraitImage": {"url":"https://...","caption":"","sourceUrl":""} or null
}

Rules:
- usedSourceUrls must list every URL you relied on for factual claims
- If sources do not clearly match this person, set needsMoreInfo true and confidence below 0.45
- Do NOT invent awards, employers, exhibitions, or quotes not found in search
- suggestedWebsite should be their own site when visible; avoid social media
- portraitImage: at most one headshot or portrait photo URL from search; use null if none found`;
}

function extractResponseText(data) {
  for (const item of data.output || []) {
    if (item.type !== 'message') continue;
    for (const part of item.content || []) {
      if (part.type === 'output_text' && part.text) return part.text;
    }
  }
  return '';
}

function extractUrlCitations(data) {
  const sources = [];
  for (const item of data.output || []) {
    if (item.type !== 'message') continue;
    for (const part of item.content || []) {
      for (const ann of part.annotations || []) {
        if (ann.type === 'url_citation' && ann.url) {
          sources.push({
            title: ann.title || ann.url,
            url: ann.url,
            snippet: '',
          });
        }
      }
    }
  }
  return sources;
}

function extractWebSearchCallSources(data) {
  const sources = [];
  for (const item of data.output || []) {
    if (item.type !== 'web_search_call') continue;
    for (const src of item.action?.sources || []) {
      if (src?.url) {
        sources.push({
          title: src.title || src.url,
          url: src.url,
          snippet: src.snippet || '',
        });
      }
    }
  }
  return sources;
}

function webSearchWasPerformed(data) {
  return (data.output || []).some((item) => item.type === 'web_search_call');
}

function mergeSearchSources(...groups) {
  return dedupeSources(groups.flat());
}

function appendParsedSourceUrls(searchSources, parsed) {
  const merged = [...searchSources];
  const known = new Set(merged.map((s) => normalizeUrlKey(s.url)));

  for (const url of parsed.usedSourceUrls || []) {
    if (typeof url !== 'string' || !url.startsWith('http')) continue;
    const key = normalizeUrlKey(url);
    if (known.has(key)) continue;
    known.add(key);
    merged.push({ title: url, url, snippet: '' });
  }

  return merged;
}

function resolveCitedSources(parsed, searchSources) {
  if (Array.isArray(parsed.usedSourceUrls) && parsed.usedSourceUrls.length) {
    const wanted = new Set(parsed.usedSourceUrls.map(normalizeUrlKey));
    return searchSources.filter((s) => wanted.has(normalizeUrlKey(s.url)));
  }

  const usedIndices = Array.isArray(parsed.usedSourceIndices)
    ? parsed.usedSourceIndices.filter((i) => Number.isInteger(i) && searchSources[i])
    : [];

  return usedIndices.map((i) => searchSources[i]);
}

async function callOpenAIWithWebSearch(person, config) {
  const model =
    config.profileModel ||
    config.model ||
    process.env.OPENAI_PROFILE_MODEL ||
    'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      tools: [{ type: 'web_search' }],
      tool_choice: 'required',
      include: ['web_search_call.action.sources'],
      text: { format: { type: 'json_object' } },
      input: [
        {
          role: 'system',
          content:
            'You are a careful craft-network curator. Search the web, cite real sources, and output JSON only.',
        },
        {
          role: 'user',
          content: buildNativeSearchPrompt(person),
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI web search failed (${response.status})`);
  }

  const data = await response.json();
  const rawText = extractResponseText(data);
  if (!rawText) {
    throw new Error('OpenAI web search returned no text output');
  }

  const parsed = parseProfileJson(rawText);
  const searchSources = appendParsedSourceUrls(
    mergeSearchSources(extractUrlCitations(data), extractWebSearchCallSources(data)),
    parsed,
  );

  const searchStatus = searchSources.length
    ? 'ok'
    : webSearchWasPerformed(data)
      ? 'no_results'
      : 'search_skipped';

  return { parsed, searchSources, searchStatus, searchPerformed: webSearchWasPerformed(data) };
}

export function normalizeProfile(
  parsed,
  person,
  searchSources = [],
  searchStatus = 'ok',
  searchPerformed = searchSources.length > 0,
) {
  const fieldScore = scorePersonMatchConfidence(person);
  const citedSources = resolveCitedSources(parsed, searchSources);
  const citedKeys = new Set(citedSources.map((s) => normalizeUrlKey(s.url)));

  const allSources = searchSources.map((s) => ({
    title: s.title,
    url: s.url,
    snippet: s.snippet,
    cited: citedKeys.has(normalizeUrlKey(s.url)),
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
        ? 'Web search is not configured — set OPENAI_API_KEY on the Render proxy.'
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
    searchPerformed: Boolean(searchPerformed || searchSources.length > 0),
    searchStatus,
    artistImages: [],
    artworkImages: [],
  };
}

function buildMissingSearchProfile(person) {
  return attachImagesToProfile(
    {
      confidence: 0.1,
      matchSummary: 'Web search is not configured — set OPENAI_API_KEY on the Render proxy.',
      tagline: '',
      bio:
        'This profile could not be verified against the web. Configure OPENAI_API_KEY on Render (craft-network-llm), then regenerate — or paste the artist\'s website manually.',
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

  if (!llmConfig?.apiKey) {
    return buildMissingSearchProfile(trimmed);
  }

  const { parsed, searchSources, searchStatus, searchPerformed } =
    await callOpenAIWithWebSearch(trimmed, llmConfig);

  const profile = normalizeProfile(
    parsed,
    trimmed,
    searchSources,
    searchStatus,
    searchPerformed,
  );

  const portraitInput = parsed.portraitImage
    ? [parsed.portraitImage]
    : parsed.artistImages;
  const artistImages = normalizeProfileImages(portraitInput, trimmed.name, 1);

  return attachImagesToProfile(profile, artistImages, []);
}
