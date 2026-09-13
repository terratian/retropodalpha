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

<div class="nano-chassis">
  <div class="nano-screen" on:click={mountFiles}>
    <div class="nano-status">Nano 3G • {isPlaying ? '▶' : '⏸'}</div>
    <div class="nano-art-box">
      {#if tracks[currentIndex]?.artUrl}<img src={tracks[currentIndex].artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
    </div>
    <div class="nano-track-info">
      <strong>{tracks[currentIndex]?.title || 'Tap to Mount Music'}</strong>
      <span>{tracks[currentIndex]?.artist || 'Local Library'}</span>
    </div>
  </div>
  <div class="nano-wheel" on:click={() => { if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}>
    <div class="nano-center-btn" on:click|stopPropagation={togglePlay}></div>
  </div>
</div>

<style>
  .nano-chassis { width: 230px; height: 440px; background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); border-radius: 44px; padding: 22px 18px; box-sizing: border-box; box-shadow: 0 35px 70px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: space-between; border: 2px solid #fda4af; }
  .nano-screen { width: 100%; height: 210px; background: #0f172a; border-radius: 12px; border: 3px solid #334155; display: flex; flex-direction: column; align-items: center; padding: 8px; box-sizing: border-box; cursor: pointer; }
  .nano-status { width: 100%; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: bold; }
  .nano-art-box { width: 110px; height: 110px; background: #1e293b; border-radius: 8px; margin-top: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center; }
  .nano-art-box img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 36px; color: #64748b; }
  .nano-track-info { margin-top: 6px; text-align: center; width: 100%; }
  .nano-track-info strong { display: block; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
  .nano-track-info span { font-size: 10px; color: #cbd5e1; }
  .nano-wheel { width: 140px; height: 140px; background: #f8fafc; border-radius: 50%; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; cursor: pointer; border: 1px solid #cbd5e1; }
  .nano-center-btn { width: 50px; height: 50px; background: #e2e8f0; border-radius: 50%; border: 1px solid #cbd5e1; }
</style>
