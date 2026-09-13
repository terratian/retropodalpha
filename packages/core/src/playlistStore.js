export function savePlaylist(name, tracks) {
  const playlists = getAllPlaylists();
  playlists[name] = tracks.map(t => ({ title: t.title, artist: t.artist, album: t.album, url: t.url, artUrl: t.artUrl }));
  localStorage.setItem('retropod_playlists', JSON.stringify(playlists));
}

export function getAllPlaylists() {
  try {
    return JSON.parse(localStorage.getItem('retropod_playlists')) || {};
  } catch {
    return {};
  }
}

export function deletePlaylist(name) {
  const playlists = getAllPlaylists();
  delete playlists[name];
  localStorage.setItem('retropod_playlists', JSON.stringify(playlists));
}

export function exportPlaylistsJSON() {
  const data = localStorage.getItem('retropod_playlists') || '{}';
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'retropod-playlists.json';
  a.click();
}

export function importPlaylistsJSON(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      localStorage.setItem('retropod_playlists', JSON.stringify(imported));
      if (callback) callback(true);
    } catch {
      if (callback) callback(false);
    }
  };
  reader.readAsText(file);
}
