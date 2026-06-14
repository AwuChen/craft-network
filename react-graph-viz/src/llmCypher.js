import {
  NAME_ALIASES,
  getRosterContext,
  formatUserRosterForPrompt,
  preprocessQuestion,
  postprocessCypher,
} from './craftNetworkData';

const VALID_CYPHER_START = ['MATCH', 'CREATE', 'MERGE', 'DELETE', 'SET', 'RETURN', 'WITH', 'UNWIND', 'CALL'];

const VISUALIZATION_RETURN = `RETURN u.name AS source, u.role AS sourceRole, u.location AS sourceLocation, u.website AS sourceWebsite,
         v.name AS target, v.role AS targetRole, v.location AS targetLocation, v.website AS targetWebsite`;

function buildSchemaPrompt() {
  const roster = getRosterContext();
  const { anchor, roles, craftsmen, knownUsers, source } = roster;
  const rosterLines = formatUserRosterForPrompt(roster);

  return `You translate natural language into Neo4j Cypher for the Craft Network — a social graph of Kyoto/Japan craftsmen, artists, researchers, and collaborators collected in person.

Roster source: ${source}${roster.fetchedAt ? ` (loaded ${new Date(roster.fetchedAt).toISOString()})` : ''}

Graph schema:
- Nodes: (:User {name: string, role: string, location: string, website: string, title: string})
- Relationships: (User)-[:CONNECTED_TO]->(User) — directed; edges point from one person toward another
- NFC event nodes use names like User-1739873466961 (timestamp suffix). Do NOT match these unless the user explicitly asks for NFC/timestamp users.

Anchor node (network root — always exists):
- ${anchor.name} | role: ${anchor.role} | title: ${anchor.title || 'digital craftsman'} | website: ${anchor.website || 'https://awuchen.github.io/'}
- NFC onboarding always ends with a CONNECTED_TO path toward ${anchor.name}

CRITICAL — resolving "Awu" in natural language:
- The user often says "Awu" meaning the existing node "${anchor.name}" — NEVER create a new node named "Awu"
- ALWAYS use exact match: {name: '${anchor.name}'} — NEVER use CONTAINS 'awu' or partial name matching for this person
- Applies to: "connect Awu to Shuji", "show Awu's network", "Awu's connections", "link Awu Chen to ..."
- Other aliases: ${Object.entries(NAME_ALIASES).map(([k, v]) => `"${k}" → "${v}"`).join(', ')}

Name matching rules:
- Known people (below): use exact {name: 'Full Name'} when the user names someone specifically or asks to connect/update them
- Role/location filters: use toLower(field) CONTAINS for broad searches (e.g. all craftsmen, artists in Kyoto)
- Do not CONTAINS-match on "Awu" — only exact '${anchor.name}'
- Capitalize person names in Title Case in mutations

Roles in this network: ${roles.join(', ')}

Craftsmen in roster (${craftsmen.length} with role craftsman):
${craftsmen.join(', ')}

Full known roster (${knownUsers.length} named profiles):
${rosterLines}

Query intents:
1. "visualization" — show/filter subgraph on the canvas (show, find, display, who is connected to, network of X)
2. "analytical" — numeric/list answer in a modal (how many, count, what roles exist, list locations)
3. "mutation" — write to graph (connect, link, add, update, delete, set role/website)

Rules for visualization Cypher:
- MUST use graph-compatible RETURN columns exactly:
  ${VISUALIZATION_RETURN}
- Node-only filter example:
  MATCH (u:User)
  WHERE toLower(u.role) CONTAINS 'craftsman'
  OPTIONAL MATCH (u)-[r:CONNECTED_TO]->(v:User)
  ${VISUALIZATION_RETURN}
- Subgraph around a named person (use exact name):
  MATCH (u:User {name: '${anchor.name}'})-[r:CONNECTED_TO]->(v:User)
  ${VISUALIZATION_RETURN}
- Bidirectional neighborhood of a person:
  MATCH (center:User {name: 'Shuji Nakagawa'})
  OPTIONAL MATCH (center)-[r:CONNECTED_TO]->(v:User)
  WITH center, collect(v) AS outs
  UNWIND outs AS v
  WITH center AS u, v
  ${VISUALIZATION_RETURN}

Rules for analytical Cypher:
- Return COUNT, collect(DISTINCT ...), or scalar values
- Read-only — no CREATE/MERGE/SET/DELETE

Rules for mutation Cypher:
- Only when user explicitly asks to connect, add, update, or delete
- Use MATCH with exact {name: '...'} for known people, then MERGE relationship
- CONNECTED_TO direction: (source)-[:CONNECTED_TO]->(target) — "connect A to B" means A knows/is linked toward B
- Connect example (exact names, no fuzzy match):
  MATCH (a:User {name: '${anchor.name}'}), (b:User {name: 'Shuji Nakagawa'})
  MERGE (a)-[:CONNECTED_TO]->(b)
- Update example:
  MATCH (u:User {name: 'Shuji Nakagawa'}) SET u.location = 'Kyoto', u.website = 'https://example.com'
- Never MERGE (u:User {name: 'Awu'}) — always '${anchor.name}'

Examples:
User: "show me all craftsmen"
→ {"intent":"visualization","cypher":"MATCH (u:User) WHERE toLower(u.role) CONTAINS 'craftsman' OPTIONAL MATCH (u)-[r:CONNECTED_TO]->(v:User) ${VISUALIZATION_RETURN}"}

User: "how many artists are there"
→ {"intent":"analytical","cypher":"MATCH (u:User) WHERE toLower(u.role) CONTAINS 'artist' RETURN count(u) AS count"}

User: "connect Awu to Shuji Nakagawa"
→ {"intent":"mutation","cypher":"MATCH (a:User {name: '${anchor.name}'}), (b:User {name: 'Shuji Nakagawa'}) MERGE (a)-[:CONNECTED_TO]->(b)"}

User: "show Awu's connections"
→ {"intent":"visualization","cypher":"MATCH (u:User {name: '${anchor.name}'})-[r:CONNECTED_TO]->(v:User) ${VISUALIZATION_RETURN}"}

User: "find people with website instagram"
→ {"intent":"visualization","cypher":"MATCH (u:User) WHERE u.website IS NOT NULL AND toLower(u.website) CONTAINS 'instagram' OPTIONAL MATCH (u)-[r:CONNECTED_TO]->(v:User) ${VISUALIZATION_RETURN}"}

Respond with JSON only, no markdown:
{"intent":"visualization|analytical|mutation","cypher":"..."}`;
}

export function isRawCypherQuery(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  const upper = trimmed.toUpperCase();
  return VALID_CYPHER_START.some((keyword) => upper.startsWith(keyword));
}

export function classifyQueryIntent(cypher) {
  const upper = cypher.trim().toUpperCase();
  if (/(CREATE|MERGE|SET|DELETE|REMOVE|DETACH DELETE)/.test(upper)) {
    return 'mutation';
  }
  if (/^\s*(RETURN|WITH)\s+/i.test(cypher) && !/CONNECTED_TO/i.test(cypher)) {
    return 'analytical';
  }
  if (/COUNT\s*\(/i.test(cypher) && !/AS source/i.test(cypher)) {
    return 'analytical';
  }
  if (/AS source,/i.test(cypher) || /CONNECTED_TO/i.test(cypher)) {
    return 'visualization';
  }
  return 'analytical';
}

function stripCodeFences(text) {
  if (!text) return '';
  const fenced = text.match(/```(?:json|cypher)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

function parseLlmJson(raw) {
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

function normalizeCypher(cypher) {
  if (!cypher || typeof cypher !== 'string') {
    throw new Error('LLM did not return a Cypher query');
  }
  const query = postprocessCypher(cypher.trim().replace(/;\s*$/, ''));
  const upper = query.toUpperCase();
  const isValid = VALID_CYPHER_START.some((keyword) => upper.startsWith(keyword));
  if (!isValid) {
    throw new Error(`Generated query is not valid Cypher: ${query.slice(0, 80)}`);
  }
  return query;
}

function getProviderConfig() {
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

async function callOpenAI(question, config) {
  const systemPrompt = buildSchemaPrompt();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
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

async function callAnthropic(question, config) {
  const systemPrompt = buildSchemaPrompt();
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic request failed (${response.status})`);
  }

  const data = await response.json();
  const block = data.content?.find((part) => part.type === 'text');
  return block?.text || '';
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

  const normalizedQuestion = preprocessQuestion(trimmed);
  const config = getProviderConfig();
  const raw =
    config.provider === 'anthropic'
      ? await callAnthropic(normalizedQuestion, config)
      : await callOpenAI(normalizedQuestion, config);

  const parsed = parseLlmJson(raw);
  const cypher = normalizeCypher(parsed.cypher);
  const intent = parsed.intent || classifyQueryIntent(cypher);

  return { cypher, intent, source: config.provider };
}
