const GENERIC_ROLES = /^(affiliate|holder|new user|attendee|artist|craftsman|nfc|nfc connect)$/i;

/** Merge legacy role + title into one craft label for display/editing. */
export function formatCraftForDisplay(node) {
  const role = (node?.role || '').trim();
  const title = (node?.title || '').trim();

  if (!role && !title) return '';
  if (!title || role.toLowerCase() === title.toLowerCase()) return role || title;
  if (GENERIC_ROLES.test(role) && title) return title;
  if (role && title && !role.toLowerCase().includes(title.toLowerCase())) {
    return `${role} — ${title}`;
  }
  return role || title;
}

export async function fetchUserProfile(driver, name) {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:User {name: $name})
       RETURN coalesce(u.title, '') AS title,
              coalesce(u.profileTagline, '') AS tagline,
              coalesce(u.profileBio, '') AS bio,
              coalesce(u.profileCraftStatement, '') AS craftStatement,
              coalesce(u.profileHighlights, '[]') AS highlights,
              coalesce(u.profileConfidence, 0.0) AS confidence,
              coalesce(u.profileVerified, false) AS verified,
              coalesce(u.profileMatchSummary, '') AS matchSummary`,
      { name },
    );

    if (result.records.length === 0) return null;

    const record = result.records[0];
    let highlights = [];
    try {
      highlights = JSON.parse(record.get('highlights') || '[]');
    } catch (_) {
      highlights = [];
    }

    return {
      title: record.get('title'),
      tagline: record.get('tagline'),
      bio: record.get('bio'),
      craftStatement: record.get('craftStatement'),
      highlights,
      confidence: record.get('confidence'),
      verified: record.get('verified'),
      matchSummary: record.get('matchSummary'),
    };
  } finally {
    await session.close();
  }
}

export async function saveUserWithProfile(driver, {
  oldName,
  name,
  role,
  location,
  website,
  profile,
  verified,
}) {
  const session = driver.session();
  try {
    await session.run(
      `MATCH (u:User {name: $oldName})
       SET u.name = $name,
           u.role = $role,
           u.title = '',
           u.location = $location,
           u.website = $website,
           u.profileTagline = $tagline,
           u.profileBio = $bio,
           u.profileCraftStatement = $craftStatement,
           u.profileHighlights = $highlights,
           u.profileConfidence = $confidence,
           u.profileMatchSummary = $matchSummary,
           u.profileVerified = $verified,
           u.profileGeneratedAt = datetime()`,
      {
        oldName,
        name,
        role,
        location,
        website,
        tagline: profile?.tagline || '',
        bio: profile?.bio || '',
        craftStatement: profile?.craftStatement || '',
        highlights: JSON.stringify(profile?.highlights || []),
        confidence: profile?.confidence ?? 0,
        matchSummary: profile?.matchSummary || '',
        verified: Boolean(verified),
      },
    );
  } finally {
    await session.close();
  }
}

export async function saveUserFieldsOnly(driver, { oldName, name, role, location, website }) {
  const session = driver.session();
  try {
    await session.run(
      `MATCH (u:User {name: $oldName})
       SET u.name = $name,
           u.role = $role,
           u.title = '',
           u.location = $location,
           u.website = $website`,
      { oldName, name, role, location, website },
    );
  } finally {
    await session.close();
  }
}
