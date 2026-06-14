import React, { useEffect, useState } from 'react';
import './ProfileReviewModal.css';

function confidenceLabel(profile) {
  if (profile?.needsMoreInfo) {
    return { text: 'Verify with sources', className: 'weak' };
  }
  const score = profile?.confidence ?? 0;
  if (score >= 0.7) return { text: 'Strong match', className: 'strong' };
  if (score >= 0.45) return { text: 'Partial match', className: 'partial' };
  return { text: 'Needs more detail', className: 'weak' };
}

function formatUrlDisplay(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return url;
  }
}

export default function ProfileReviewModal({
  person,
  profile,
  isGenerating,
  error,
  onConfirm,
  onSaveEdited,
  onSkip,
  onRegenerate,
  onClose,
}) {
  const [draft, setDraft] = useState(profile || null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState('');

  useEffect(() => {
    setDraft(profile || null);
    setIsEditing(false);
    setSelectedWebsite(person?.website || profile?.suggestedWebsite || '');
  }, [profile, person]);

  if (!person && !isGenerating) return null;

  const badge = confidenceLabel(draft);
  const sources = draft?.sources || [];
  const hasSources = sources.length > 0;

  const handleFieldChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const submitProfile = (profileDraft) => {
    const payload = { ...profileDraft, website: selectedWebsite };
    if (isEditing) onSaveEdited(payload, selectedWebsite);
    else onConfirm(payload, selectedWebsite);
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {isGenerating ? (
          <div className="profile-modal-loading">
            <p className="profile-modal-kicker">Craft Network</p>
            <h2>Searching & composing…</h2>
            <p>Looking for public sources about {person?.name || 'this person'}.</p>
          </div>
        ) : error ? (
          <div className="profile-modal-error">
            <h2>Could not generate profile</h2>
            <p>{error}</p>
            <div className="profile-modal-actions">
              <button type="button" onClick={onRegenerate}>Try again</button>
              <button type="button" className="secondary" onClick={onSkip}>Save without profile</button>
            </div>
          </div>
        ) : draft ? (
          <>
            <p className="profile-modal-kicker">Profile preview</p>
            <h2>{person.name}</h2>
            <p className="profile-modal-role">{person.role}{person.location ? ` · ${person.location}` : ''}</p>
            <span className={`profile-confidence ${badge.className}`}>{badge.text}</span>
            {draft.matchSummary && <p className="profile-match-summary">{draft.matchSummary}</p>}

            <div className="profile-sources-section">
              <h3>Sources</h3>
              {hasSources ? (
                <ul className="profile-source-list">
                  {sources.map((source) => (
                    <li key={source.url} className={source.cited ? 'cited' : ''}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title || formatUrlDisplay(source.url)}
                      </a>
                      {source.cited && <span className="profile-source-badge">Used in profile</span>}
                      {source.snippet && <p className="profile-source-snippet">{source.snippet.slice(0, 160)}…</p>}
                    </li>
                  ))}
                </ul>
              ) : draft.searchStatus === 'missing_api_key' ? (
                <p className="profile-config-warning">
                  Web search is not enabled on the server. Add <strong>TAVILY_API_KEY</strong> in Render
                  (craft-network-llm → Environment), redeploy, then regenerate. Without it, profiles cannot
                  match a Google search.
                </p>
              ) : (
                <p className="profile-needs-info">
                  No web sources found for this name and craft. Try adding their website below, then regenerate.
                </p>
              )}
            </div>

            <div className="profile-website-section">
              <label>
                Artist website
                <input
                  type="url"
                  value={selectedWebsite}
                  placeholder="https://…"
                  onChange={(e) => setSelectedWebsite(e.target.value)}
                />
              </label>
              {draft.suggestedWebsite && draft.suggestedWebsite !== selectedWebsite && (
                <button
                  type="button"
                  className="profile-use-website"
                  onClick={() => setSelectedWebsite(draft.suggestedWebsite)}
                >
                  Use suggested: {formatUrlDisplay(draft.suggestedWebsite)}
                </button>
              )}
              {selectedWebsite && (
                <a
                  className="profile-website-preview"
                  href={selectedWebsite.startsWith('http') ? selectedWebsite : `https://${selectedWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open website ↗
                </a>
              )}
            </div>

            {draft.needsMoreInfo && (
              <p className="profile-needs-info">
                Review the sources above before saving. If none match this person, edit the profile or add their website.
              </p>
            )}

            {(draft.artistImages?.length > 0 || draft.artworkImages?.length > 0) && (
              <div className="profile-images-preview">
                {draft.artistImages?.length > 0 && (
                  <div>
                    <h3>Artist</h3>
                    <div className="profile-image-row">
                      {draft.artistImages.map((img) => (
                        <img key={img.url} src={img.url} alt={img.caption || person.name} loading="lazy" />
                      ))}
                    </div>
                  </div>
                )}
                {draft.artworkImages?.length > 0 && (
                  <div>
                    <h3>Works</h3>
                    <div className="profile-image-row">
                      {draft.artworkImages.map((img) => (
                        <img key={img.url} src={img.url} alt={img.caption || 'Artwork'} loading="lazy" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isEditing ? (
              <div className="profile-edit-fields">
                <label>
                  Tagline
                  <input
                    value={draft.tagline || ''}
                    onChange={(e) => handleFieldChange('tagline', e.target.value)}
                  />
                </label>
                <label>
                  Bio
                  <textarea
                    rows={5}
                    value={draft.bio || ''}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                  />
                </label>
                <label>
                  Craft statement
                  <input
                    value={draft.craftStatement || ''}
                    onChange={(e) => handleFieldChange('craftStatement', e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className="profile-preview-copy">
                {draft.tagline && <p className="profile-tagline">{draft.tagline}</p>}
                {draft.bio && <p className="profile-bio">{draft.bio}</p>}
                {draft.craftStatement && <p className="profile-craft">{draft.craftStatement}</p>}
                {draft.highlights?.length > 0 && (
                  <ul className="profile-highlights">
                    {draft.highlights.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="profile-question">Is this profile accurate?</p>
            <div className="profile-modal-actions">
              {isEditing ? (
                <button type="button" onClick={() => submitProfile(draft)}>
                  Save corrected profile
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => submitProfile(draft)}>Yes, save profile</button>
                  <button type="button" className="secondary" onClick={() => setIsEditing(true)}>
                    No, let me fix it
                  </button>
                </>
              )}
              <button type="button" className="secondary" onClick={onRegenerate}>Regenerate</button>
              <button type="button" className="ghost" onClick={onSkip}>Skip for now</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
