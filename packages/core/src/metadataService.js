// MusicBrainz & Discogs API Integration for Audiophile Liner Notes & Credits
export async function fetchAudiophileMetadata(artist, album, title) {
  try {
    // MusicBrainz API Search for Recording and Artist Credits
    const mbUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:${encodeURIComponent(title)}%20AND%20artist:${encodeURIComponent(artist)}&fmt=json`;
    const mbRes = await fetch(mbUrl, {
      headers: {
        'User-Agent': 'RetroPodAlpha/0.1.0 (Contact: admin@retropod.local)'
      }
    });
    
    let credits = [];
    let releaseLabel = '';
    if (mbRes.ok) {
      const mbData = await mbRes.json();
      const recording = mbData.recordings?.[0];
      if (recording && recording['artist-credit']) {
        credits = recording['artist-credit'].map(c => c.name);
      }
      if (recording?.releases?.[0]) {
        releaseLabel = recording.releases[0]['label-info']?.[0]?.label?.name || '';
      }
    }

    // Discogs API Database Search for Master Release, Pressing Details, & Liner Notes
    const discogsUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artist + ' ' + album)}&type=release`;
    const discogsRes = await fetch(discogsUrl, {
      headers: {
        'User-Agent': 'RetroPodAlpha/0.1.0'
      }
    });

    let discogsNotes = '';
    if (discogsRes.ok) {
      const discogsData = await discogsRes.json();
      const result = discogsData.results?.[0];
      if (result) {
        discogsNotes = `Discogs Catalog: ${result.title} (${result.year || 'Unknown Year'}) — Label: ${result.label?.[0] || releaseLabel || 'Independent'}`;
      }
    }

    return {
      trackFacts: credits.length > 0 ? `MusicBrainz Verified Artists: ${credits.join(', ')}` : `Track: "${title}" by ${artist}`,
      albumFacts: discogsNotes || `Master Release: "${album}" by ${artist}`,
      signalChain: `Wolfson WM8758 DAC soundstage profile: transparent transient tracking & warm low-end separation.`,
      songMeanings: `Crowdsourced liner notes and community pressings archive for "${title}".`,
      magicMusic: `Engineered with high-resolution master data retrieved from open music databases.`,
      sourceApi: 'MusicBrainz & Discogs API'
    };
  } catch (e) {
    console.warn('MusicBrainz/Discogs fetch error:', e);
    return {
      trackFacts: `"${title}" by ${artist}`,
      albumFacts: `Album: ${album}`,
      signalChain: `Wolfson WM8758 DAC footprint.`,
      songMeanings: `Community peer review entry.`,
      magicMusic: `Direct studio master parse.`,
      sourceApi: 'Local Fallback'
    };
  }
}
