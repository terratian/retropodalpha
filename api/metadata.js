export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const token = process.env.GENIUS_ACCESS_TOKEN;
    const geniusRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const geniusData = await geniusRes.json();
    const hit = geniusData.response?.hits?.[0]?.result;

    res.status(200).json({
      title: hit?.title || q,
      artist: hit?.primary_artist?.name || 'Unknown Artist',
      geniusUrl: hit?.url || null,
      songArt: hit?.song_art_image_url || null,
      annotationSummary: hit ? `Genius Verified: "${hit.title}" by ${hit.primary_artist?.name}. Indexed in crowdsourced database.` : 'No direct Genius match found.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
