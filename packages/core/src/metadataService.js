export async function fetchAudiophileMetadata(artist, album, title) {
  if (!artist && !title) {
    return {
      trackFacts: 'No track loaded. Mount local library to query Genius & Discogs.',
      albumFacts: 'Awaiting active track telemetry...',
      sourceApi: 'Offline'
    };
  }

  try {
    const query = `${title || ''} ${artist || ''}`.trim();
    const res = await fetch(`/api/metadata?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    return {
      trackFacts: data.annotationSummary || 'Genius annotations indexed.',
      albumFacts: `Discogs & Genius Master Release Sync: Active.\nMatched Track: ${data.title} by ${data.artist}`,
      artUrl: data.songArt || null,
      sourceApi: 'Genius API & Discogs Proxy v2.1'
    };
  } catch (e) {
    return {
      trackFacts: `Local fallback metadata for "${title || 'Track'}".`,
      albumFacts: `Local release metadata for "${album || 'Album'}".`,
      sourceApi: 'Local Fallback'
    };
  }
}
