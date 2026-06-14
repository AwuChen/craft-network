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

export function profilePathForName(name) {
  return `/profile/${encodeURIComponent(name)}`;
}

function parseJsonField(raw, fallback = []) {
  try {
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (_) {
    return fallback;
  }
}

function mapProfileRecord(record) {
  return {
    tagline: record.get('tagline'),
    bio: record.get('bio'),
    craftStatement: record.get('craftStatement'),
    highlights: parseJsonField(record.get('highlights')),
    profileSources: parseJsonField(record.get('profileSources')),
    artistImages: parseJsonField(record.get('artistImages')),
    artworkImages: parseJsonField(record.get('artworkImages')),
    confidence: record.get('confidence'),
    verified: record.get('verified'),
    matchSummary: record.get('matchSummary'),
  };
}

export async function fetchUserProfile(driver, name) {
  const full = await fetchFullUserProfile(driver, name);
  if (!full) return null;
  return full.profile;
}

export async function fetchFullUserProfile(driver, name) {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:User {name: $name})
       RETURN u.name AS name,
              coalesce(u.role, '') AS role,
              coalesce(u.title, '') AS title,
              coalesce(u.location, '') AS location,
              coalesce(u.website, '') AS website,
              coalesce(u.profileTagline, '') AS tagline,
              coalesce(u.profileBio, '') AS bio,
              coalesce(u.profileCraftStatement, '') AS craftStatement,
              coalesce(u.profileHighlights, '[]') AS highlights,
              coalesce(u.profileSources, '[]') AS profileSources,
              coalesce(u.profileArtistImages, '[]') AS artistImages,
              coalesce(u.profileArtworkImages, '[]') AS artworkImages,
              coalesce(u.profileConfidence, 0.0) AS confidence,
              coalesce(u.profileVerified, false) AS verified,
              coalesce(u.profileMatchSummary, '') AS matchSummary`,
      { name },
    );

    if (result.records.length === 0) return null;

    const record = result.records[0];
    return {
      name: record.get('name'),
      role: record.get('role'),
      title: record.get('title'),
      location: record.get('location'),
      website: record.get('website'),
      craft: formatCraftForDisplay({
        role: record.get('role'),
        title: record.get('title'),
      }),
      profile: mapProfileRecord(record),
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
           u.profileSources = $profileSources,
           u.profileArtistImages = $artistImages,
           u.profileArtworkImages = $artworkImages,
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
        profileSources: JSON.stringify(profile?.citedSources || profile?.sources || []),
        artistImages: JSON.stringify(profile?.artistImages || []),
        artworkImages: JSON.stringify(profile?.artworkImages || []),
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
