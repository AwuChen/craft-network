import React, { useEffect, useState } from 'react';
import './ProfileReviewModal.css';

function confidenceLabel(score) {
  if (score >= 0.7) return { text: 'Strong match', className: 'strong' };
  if (score >= 0.45) return { text: 'Partial match', className: 'partial' };
  return { text: 'Needs more detail', className: 'weak' };
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

  useEffect(() => {
    setDraft(profile || null);
    setIsEditing(false);
  }, [profile]);

  if (!person && !isGenerating) return null;

  const confidence = draft?.confidence ?? 0;
  const badge = confidenceLabel(confidence);

  const handleFieldChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {isGenerating ? (
          <div className="profile-modal-loading">
            <p className="profile-modal-kicker">Craft Network</p>
            <h2>Composing profile…</h2>
            <p>Reading {person?.name || 'this person'}&apos;s place in the network.</p>
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

            {draft.needsMoreInfo && (
              <p className="profile-needs-info">
                We need a bit more detail (full name, craft, or website) to be confident this is the right person.
              </p>
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
                <button type="button" onClick={() => onSaveEdited(draft)}>
                  Save corrected profile
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => onConfirm(draft)}>Yes, save profile</button>
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
