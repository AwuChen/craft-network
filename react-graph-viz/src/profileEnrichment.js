/**
 * Generate artistic profile copy for Craft Network members.
 * Shared by the React app (local dev), Render proxy, and batch script.
 */

const GENERIC_NAMES = new Set([
  'alex', 'amy', 'john', 'friend', 'test', 'boston', 'chi', 'comfy', 'jb',
  'kelly', 'arnold', 'daniel', 'hannah', 'karl', 'gary', 'eli', 'erick',
]);

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

  let score = 0.35;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) score += 0.2;
  if (GENERIC_NAMES.has(name.toLowerCase())) score -= 0.35;
  if (role && !/^(affiliate|holder|new user|nfc|attendee)$/i.test(role)) score += 0.2;
  if (location) score += 0.08;
  if (website && website.startsWith('http')) score += 0.12;

  return Math.max(0, Math.min(1, score));
}

function buildProfilePrompt(person, confidence) {
  return `You write artistic profile pages for the Craft Network — a living graph of Kyoto/Japan craftsmen, artists, researchers, and collaborators met in person.

Given ONLY the network fields below, draft a profile. Do not invent specific awards, employers, or biographical facts you cannot infer from these fields. When data is sparse, write evocative but honest copy and lower confidence.

Person:
- name: ${person.name || ''}
- craft: ${person.role || ''}
- location: ${person.location || ''}
- website: ${person.website || ''}

Heuristic match confidence from fields alone: ${confidence.toFixed(2)}

Respond with JSON only:
{
  "confidence": 0.0-1.0,
  "matchSummary": "one sentence on how well the fields identify a real person",
  "tagline": "short poetic line, max 12 words",
  "bio": "2 short paragraphs, artistic but grounded in provided fields",
  "craftStatement": "single sentence about their craft or presence in the network",
  "highlights": ["3-5 short bullet phrases"],
  "needsMoreInfo": true or false
}

Rules:
- confidence must reflect uncertainty — generic names or empty role → below 0.5
- if needsMoreInfo is true, bio should say what extra detail would help verify the person
- tone: contemplative, craft-forward, Kyoto/Japan cultural context when location fits
- never claim you searched the web; you only see these fields`;
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
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a craft-network curator writing profile pages. Output JSON only.',
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

export function normalizeProfile(parsed, person) {
  const fieldScore = scorePersonMatchConfidence(person);
  const confidence = Math.min(
    fieldScore,
    typeof parsed.confidence === 'number' ? parsed.confidence : fieldScore,
  );

  return {
    confidence,
    matchSummary: parsed.matchSummary || '',
    tagline: parsed.tagline || '',
    bio: parsed.bio || '',
    craftStatement: parsed.craftStatement || '',
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : [],
    needsMoreInfo: Boolean(parsed.needsMoreInfo) || confidence < 0.45,
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

  const fieldScore = scorePersonMatchConfidence(trimmed);
  const raw = await callOpenAI(buildProfilePrompt(trimmed, fieldScore), llmConfig);
  return normalizeProfile(parseProfileJson(raw), trimmed);
}
