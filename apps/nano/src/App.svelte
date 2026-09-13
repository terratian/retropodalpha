<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;

  onMount(() => {
    if (audioElement) initAudioEngine(audioElement);
  });

  async function mountFiles() {
    playClickSound();
    try {
      const handle = await window.showDirectoryPicker();
      tracks = await scanDirectoryZeroCopy(handle, 'audio', [], () => {});
      if (tracks.length > 0) loadTrack(0);
    } catch (e) {
      console.warn(e);
    }
  }

  function loadTrack(i) {
    currentIndex = i;
    audioElement.src = tracks[i].url;
    audioElement.load();
    audioElement.play();
    isPlaying = true;
    playClickSound();
  }

  function togglePlay() {
    playClickSound();
    if (!audioElement.src && tracks.length) { loadTrack(0); return; }
    if (isPlaying) { audioElement.pause(); isPlaying = false; }
    else { audioElement.play(); isPlaying = true; }
  }
</script>

<audio bind:this={audioElement} on:ended={() => { if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}></audio>

<div class="pod-container">
  <div class="nano-chassis">
    <div class="nano-screen" role="button" tabindex="0" on:click={mountFiles} on:keydown={(e) => e.key === 'Enter' && mountFiles()}>
      <div class="nano-status">
        <span>Nano 3G</span>
        <div class="status-right">
          {#if isPlaying}
            <svg class="status-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          {:else}
            <svg class="status-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          {/if}
          <svg class="battery-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M16 7H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H4V9h12v6zm4-5h2v4h-2z"/></svg>
        </div>
      </div>
      <div class="nano-art-box">
        {#if tracks[currentIndex]?.artUrl}<img src={tracks[currentIndex].artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
      </div>
      <div class="nano-track-info">
        <strong>{tracks[currentIndex]?.title || 'Tap to Mount Music'}</strong>
        <span>{tracks[currentIndex]?.artist || 'Local Library'}</span>
      </div>
    </div>
    <div class="nano-wheel" role="button" tabindex="0" on:click={() => { if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }} on:keydown={(e) => e.key === 'Enter' && tracks.length && loadTrack((currentIndex + 1) % tracks.length)}>
      <div class="nano-center-btn" role="button" tabindex="0" on:click|stopPropagation={togglePlay} on:keydown={(e) => e.key === 'Enter' && togglePlay()}></div>
    </div>
  </div>
</div>

<style>
  body { background: #0b0f19; margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  .pod-container { display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
  .nano-chassis { width: 230px; height: 440px; background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); border-radius: 44px; padding: 22px 18px; box-sizing: border-box; box-shadow: 0 35px 70px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: space-between; border: 2px solid #fda4af; }
  .nano-screen { width: 100%; height: 210px; background: #0f172a; border-radius: 12px; border: 3px solid #334155; display: flex; flex-direction: column; align-items: center; padding: 8px; box-sizing: border-box; cursor: pointer; }
  .nano-status { width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; font-weight: bold; }
  .status-right { display: flex; align-items: center; gap: 4px; }
  .status-icon { width: 12px; height: 12px; }
  .battery-icon { width: 16px; height: 16px; }
  .nano-art-box { width: 110px; height: 110px; background: #1e293b; border-radius: 8px; margin-top: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center; }
  .nano-art-box img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 36px; color: #64748b; }
  .nano-track-info { margin-top: 6px; text-align: center; width: 100%; }
  .nano-track-info strong { display: block; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
  .nano-track-info span { font-size: 10px; color: #cbd5e1; }
  .nano-wheel { width: 140px; height: 140px; background: #f8fafc; border-radius: 50%; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; cursor: pointer; border: 1px solid #cbd5e1; }
  .nano-center-btn { width: 50px; height: 50px; background: #e2e8f0; border-radius: 50%; border: 1px solid #cbd5e1; cursor: pointer; }
</style>
