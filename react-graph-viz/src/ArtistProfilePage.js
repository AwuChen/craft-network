import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchFullUserProfile, formatCraftForDisplay } from './userProfile';
import './ArtistProfilePage.css';

export default function ArtistProfilePage({ driver }) {
  const { profileName } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const decodedName = profileName ? decodeURIComponent(profileName) : '';

  useEffect(() => {
    if (!driver || !decodedName) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFullUserProfile(driver, decodedName)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError('Profile not found.');
          setPerson(null);
        } else {
          setPerson(data);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [driver, decodedName]);

  if (loading) {
    return (
      <div className="artist-profile-page loading">
        <p className="artist-profile-kicker">Craft Network</p>
        <h1>Loading profile…</h1>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="artist-profile-page error">
        <p>{error || 'Profile not found.'}</p>
        <button type="button" onClick={() => navigate('/')}>← Back to graph</button>
      </div>
    );
  }

  const { profile } = person;
  const portrait = profile?.artistImages?.[0];
  const sources = profile?.profileSources || [];
  const website = person.website?.startsWith('http') ? person.website : person.website ? `https://${person.website}` : '';

  return (
    <div className="artist-profile-page">
      <header className="artist-profile-header">
        <Link to="/" className="artist-profile-back">← Craft Network</Link>
        <p className="artist-profile-kicker">Artist profile</p>
        <h1>{person.name}</h1>
        <p className="artist-profile-meta">
          {person.craft || formatCraftForDisplay(person)}
          {person.location ? ` · ${person.location}` : ''}
        </p>
        {profile?.tagline && <p className="artist-profile-tagline">{profile.tagline}</p>}
        {website && (
          <a className="artist-profile-website" href={website} target="_blank" rel="noopener noreferrer">
            Visit website ↗
          </a>
        )}
      </header>

      <div className="artist-profile-hero">
        {portrait ? (
          <figure className="artist-portrait">
            <img src={portrait.url} alt={person.name} loading="lazy" />
            {portrait.caption && <figcaption>{portrait.caption}</figcaption>}
          </figure>
        ) : (
          <div className="artist-portrait placeholder">
            <span>{person.name.charAt(0)}</span>
          </div>
        )}

        <section className="artist-profile-story">
          {profile?.bio && <p className="artist-profile-bio">{profile.bio}</p>}
          {profile?.craftStatement && (
            <blockquote className="artist-profile-craft">{profile.craftStatement}</blockquote>
          )}
          {profile?.highlights?.length > 0 && (
            <ul className="artist-profile-highlights">
              {profile.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {sources.length > 0 && (
        <section className="artist-profile-sources">
          <h2>Sources</h2>
          <ul>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title || source.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="artist-profile-footer">
        <button type="button" onClick={() => navigate('/')}>← Return to network graph</button>
      </footer>
    </div>
  );
}
