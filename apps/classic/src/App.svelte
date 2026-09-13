<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';
  import { fetchAudiophileMetadata } from '@retropod/core/src/metadataService.js';
  import NebulaVisualizer from '@retropod/visualizers/src/NebulaVisualizer.svelte';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let activeView = 'menu'; // menu, nowPlaying, visualizer
  let menuSelection = 0;
  let metadataInfo = null;

  const menuItems = ['Music Library', 'Nebula Light Show', 'Wolfson Audio DSP', 'Settings'];

  onMount(() => {
    if (audioElement) initAudioEngine(audioElement);
  });

  async function handleOpenDirectory() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      tracks = await scanDirectoryZeroCopy(dirHandle, 'audio', [], (msg) => console.log(msg));
      if (tracks.length > 0) {
        currentIndex = 0;
        loadTrack(currentIndex);
      }
    } catch (e) {
      console.warn('Directory selection cancelled or unsupported:', e);
    }
  }

  async function loadTrack(index) {
    if (!tracks[index]) return;
    currentIndex = index;
    const track = tracks[index];
    audioElement.src = track.url;
    audioElement.load();
    isPlaying = true;
    audioElement.play().catch(() => { isPlaying = false; });
    playClickSound();

    metadataInfo = await fetchAudiophileMetadata(track.artist, track.album, track.title);
  }

  function togglePlay() {
    playClickSound();
    if (!audioElement.src && tracks.length > 0) {
      loadTrack(0);
      return;
    }
    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
    } else {
      audioElement.play();
      isPlaying = true;
    }
  }

  function handleWheelClick(direction) {
    playClickSound();
    if (activeView === 'menu') {
      menuSelection = (menuSelection + direction + menuItems.length) % menuItems.length;
    } else if (activeView === 'nowPlaying' && tracks.length > 0) {
      let newIdx = (currentIndex + direction + tracks.length) % tracks.length;
      loadTrack(newIdx);
    }
  }

  function handleCenterButton() {
    playClickSound();
    if (activeView === 'menu') {
      if (menuSelection === 0) {
        if (tracks.length === 0) handleOpenDirectory();
        else activeView = 'nowPlaying';
      } else if (menuSelection === 1) {
        activeView = 'visualizer';
      }
    } else if (activeView === 'visualizer') {
      activeView = 'menu';
    }
  }

  function handleMenuButton() {
    playClickSound();
    if (activeView !== 'menu') {
      activeView = 'menu';
    }
  }
</script>

<audio bind:this={audioElement} on:ended={() => handleWheelClick(1)}></audio>

{#if activeView === 'visualizer'}
  <div style="position: absolute; top: 20px; left: 20px; z-index: 20;">
    <button on:click={() => activeView = 'menu'} style="padding: 8px 16px; background: #38bdf8; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Back to iPod</button>
  </div>
  <NebulaVisualizer {isPlaying} currentTrack={tracks[currentIndex]} visualizerMode={0} />
{:else}
  <div class="pod-container">
    <div class="pod-chassis">
      <div class="lcd-screen">
        <div class="status-bar">
          <span>RetroPod 5G</span>
          <span>{isPlaying ? '▶' : '⏸'}</span>
        </div>
        <div class="screen-content">
          {#if activeView === 'menu'}
            <div class="menu-title">Music</div>
            <ul>
              {#each menuItems as item, idx}
                <li class={idx === menuSelection ? 'selected' : ''}>{item}</li>
              {/each}
            </ul>
          {:else if activeView === 'nowPlaying'}
            <div class="now-playing">
              <div class="album-art">
                {#if tracks[currentIndex]?.artUrl}
                  <img src={tracks[currentIndex].artUrl} alt="Art" />
                {:else}
                  <div class="no-art">♪</div>
                {/if}
              </div>
              <div class="track-meta">
                <p class="t-title">{tracks[currentIndex]?.title || 'No Track Selected'}</p>
                <p class="t-artist">{tracks[currentIndex]?.artist || 'Connect Music Folder'}</p>
                <p class="t-album">{tracks[currentIndex]?.album || ''}</p>
                {#if metadataInfo}
                  <p class="t-credits">{metadataInfo.trackFacts}</p>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <div class="click-wheel">
        <button class="btn-menu" on:click={handleMenuButton}>MENU</button>
        <button class="btn-prev" on:click={() => handleWheelClick(-1)}>⟨⟨</button>
        <button class="btn-next" on:click={() => handleWheelClick(1)}>⟩⟩</button>
        <button class="btn-play" on:click={togglePlay}>⏸/▶</button>
        <button class="btn-center" on:click={handleCenterButton}></button>
      </div>
    </div>
  </div>
{/if}

<style>
  body { background: #0b0f19; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  .pod-container { display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
  .pod-chassis { width: 380px; height: 620px; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); border-radius: 40px; box-shadow: 0 25px 50px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.8); display: flex; flex-direction: column; align-items: center; padding: 25px 20px; box-sizing: border-box; border: 2px solid #94a3b8; }
  .lcd-screen { width: 320px; height: 260px; background: #f8fafc; color: #0f172a; border-radius: 8px; border: 4px solid #334155; display: flex; flex-direction: column; overflow: hidden; box-shadow: inset 0 4px 8px rgba(0,0,0,0.2); }
  .status-bar { background: #cbd5e1; padding: 4px 10px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; border-bottom: 1px solid #94a3b8; color: #1e293b; }
  .screen-content { padding: 12px; flex: 1; overflow-y: auto; }
  .menu-title { font-weight: bold; font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; color: #0f172a; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 6px 8px; font-size: 14px; border-radius: 4px; color: #1e293b; }
  li.selected { background: #38bdf8; color: #fff; font-weight: bold; }
  .now-playing { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .album-art { width: 90px; height: 90px; background: #cbd5e1; border-radius: 4px; overflow: hidden; display: flex; justify-content: center; align-items: center; margin-bottom: 8px; border: 1px solid #94a3b8; }
  .album-art img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 32px; color: #64748b; }
  .track-meta { font-size: 12px; line-height: 1.3; }
  .t-title { font-weight: bold; font-size: 13px; color: #0f172a; margin: 0 0 2px 0; }
  .t-artist, .t-album { color: #475569; margin: 0; }
  .t-credits { font-size: 10px; color: #0284c7; margin-top: 4px; font-style: italic; }
  .click-wheel { width: 230px; height: 230px; background: #f1f5f9; border-radius: 50%; margin-top: 25px; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.9); border: 1px solid #cbd5e1; display: flex; justify-content: center; align-items: center; }
  .click-wheel button { position: absolute; background: transparent; border: none; font-size: 11px; font-weight: bold; color: #475569; cursor: pointer; }
  .btn-menu { top: 18px; left: 50%; transform: translateX(-50%); }
  .btn-prev { left: 22px; top: 50%; transform: translateY(-50%); }
  .btn-next { right: 22px; top: 50%; transform: translateY(-50%); }
  .btn-play { bottom: 18px; left: 50%; transform: translateX(-50%); }
  .btn-center { width: 90px; height: 90px; background: #e2e8f0; border-radius: 50%; border: 1px solid #cbd5e1; cursor: pointer; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
  .btn-center:active { background: #cbd5e1; }
</style>
