import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

export async function scanDirectoryZeroCopy(dirHandle, type, results = [], onProgress) {
  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        await scanDirectoryZeroCopy(entry, type, results, onProgress);
      } else if (entry.kind === 'file') {
        const file = await entry.getFile();
        const ext = file.name.split('.').pop().toLowerCase();

        if (type === 'audio' && ['mp3', 'm4a', 'flac', 'ogg', 'wav', 'aac', 'opus', 'webm', 'alac'].includes(ext)) {
          const metadata = await new Promise((resolve) => {
            jsmediatags.read(file, {
              onSuccess: (tag) => resolve(tag.tags),
              onError: () => resolve(null)
            });
          });

          let artUrl = null;
          if (metadata && metadata.picture) {
            try {
              const { data, format } = metadata.picture;
              let base64String = '';
              for (let i = 0; i < data.length; i++) {
                base64String += String.fromCharCode(data[i]);
              }
              artUrl = `data:${format};base64,${window.btoa(base64String)}`;
            } catch (e) {
              console.warn('Art parse error:', e);
            }
          }

          let title = metadata?.title || file.name.replace(/\.[^/.]+$/, "");
          let artist = metadata?.artist || dirHandle.name || 'Unknown Artist';
          let album = metadata?.album || 'Unknown Album';

          results.push({
            id: file.name + '-' + file.size + '-' + Math.random(),
            name: file.name,
            title,
            artist,
            album,
            fileHandle: entry,
            blob: file,
            url: URL.createObjectURL(file),
            artUrl
          });
          if (onProgress) onProgress(`Indexed handles: ${results.length}...`);
        }
      }
    }
  } catch (err) {
    console.error('Directory traversal error:', err);
  }
  return results;
}
