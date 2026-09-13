<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound, setEqPreset } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';
  import NebulaVisualizer from '@retropod/core/src/NebulaVisualizer.svelte';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let activeView = 'menu';
  let menuSelection = 0;
  let currentEq = 'Flat';
  let visualizerMode = 0;

  const menuItems = ['Music Library', '3D Cover Flow', 'Wolfson Parametric EQ', 'Liner Notes & Lyrics', 'Nebula Visualizer'];
  const eqPresets = ['Flat', 'Rock', 'Bass Booster', 'Acoustic', 'Classical'];

  onMount(() => {
    if (audioElement) initAudioEngine(audioElement);
  });

  async function handleOpenDirectory() {
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

  function handleWheelClick(dir) {
    playClickSound();
    if (activeView === 'menu') {
      menuSelection = (menuSelection + dir + menuItems.length) % menuItems.length;
    } else if (activeView === 'coverflow' && tracks.length) {
      currentIndex = (currentIndex + dir + tracks.length) % tracks.length;
      loadTrack(currentIndex);
    } else if (activeView === 'eq') {
      let idx = eqPresets.indexOf(currentEq);
      idx = (idx + dir + eqPresets.length) % eqPresets.length;
      currentEq = eqPresets[idx];
      setEqPreset(currentEq);
    } else if (tracks.length) {
      currentIndex = (currentIndex + dir + tracks.length) % tracks.length;
      loadTrack(currentIndex);
    }
  }

  function selectMenuItem(idx) {
    menuSelection = idx;
    playClickSound();
    if (idx === 0) {
      if (!tracks.length) handleOpenDirectory();
      else activeView = 'nowPlaying';
    } else if (idx === 1) activeView = 'coverflow';
    else if (idx === 2) activeView = 'eq';
    else if (idx === 3) activeView = 'lyrics';
    else if (idx === 4) activeView = 'visualizer';
  }
</script>

<audio bind:this={audioElement} on:ended={() => handleWheelClick(1)}></audio>

<div class="pod-container">
  <div class="pod-chassis">
    <div class="lcd-screen">
      <div class="lcd-header">
        <span>RetroPod 5G</span>
        <div class="lcd-status-right">
          {#if isPlaying}
            <svg class="lcd-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          {:else}
            <svg class="lcd-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          {/if}
          <svg class="lcd-battery" viewBox="0 0 24 24"><path fill="currentColor" d="M16 7H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H4V9h12v6zm4-5h2v4h-2z"/></svg>
        </div>
      </div>
      <div class="lcd-body">
        {#if activeView === 'menu'}
          <div class="menu-title">Audio Suite</div>
          <ul>
            {#each menuItems as item, idx}
              <li class="{idx === menuSelection ? 'selected' : ''}" role="button" tabindex="0" on:click={() => selectMenuItem(idx)} on:keydown={(e) => e.key === 'Enter' && selectMenuItem(idx)}>{item}</li>
            {/each}
          </ul>
        {:else if activeView === 'coverflow'}
          <div class="coverflow-view" role="button" tabindex="0" on:click={() => handleWheelClick(1)} on:keydown={(e) => e.key === 'Enter' && handleWheelClick(1)}>
            <div class="coverflow-stack">
              {#each tracks as t, i}
                <div class="cover-card {i === currentIndex ? 'active-card' : ''}" role="button" tabindex="0" style="transform: translateX({(i - currentIndex) * 45}px) scale({i === currentIndex ? 1 : 0.85}); z-index: {i === currentIndex ? 10 : 5 - Math.abs(i - currentIndex)};" on:click|stopPropagation={() => loadTrack(i)} on:keydown={(e) => e.key === 'Enter' && loadTrack(i)}>
                  {#if t.artUrl}<img src={t.artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
                </div>
              {/each}
            </div>
            <p class="cf-title">{tracks[currentIndex]?.title || 'Empty Library'}</p>
          </div>
        {:else if activeView === 'eq'}
          <div class="eq-view" role="button" tabindex="0" on:click={() => handleWheelClick(1)} on:keydown={(e) => e.key === 'Enter' && handleWheelClick(1)}>
            <div class="menu-title">Wolfson Parametric EQ</div>
            <div class="eq-badge">{currentEq}</div>
          </div>
        {:else if activeView === 'visualizer'}
          <div class="visualizer-mini-wrap" role="button" tabindex="0" on:click={() => visualizerMode = (visualizerMode + 1) % 3} on:keydown={(e) => e.key === 'Enter' && (visualizerMode = (visualizerMode + 1) % 3)}>
            <NebulaVisualizer {isPlaying} currentTrack={tracks[currentIndex]} {visualizerMode} />
          </div>
        {:else}
          <div class="now-playing">
            <div class="album-art" role="button" tabindex="0" on:click={handleOpenDirectory} on:keydown={(e) => e.key === 'Enter' && handleOpenDirectory()}>
              {#if tracks[currentIndex]?.artUrl}<img src={tracks[currentIndex].artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
            </div>
            <p class="track-title">{tracks[currentIndex]?.title || 'No Track Loaded'}</p>
            <p class="track-artist">{tracks[currentIndex]?.artist || 'Click to Mount Folder'}</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="click-wheel">
      <button class="w-menu" on:click={() => activeView = 'menu'}>MENU</button>
      <button class="w-prev" on:click={() => handleWheelClick(-1)}>⟨⟨</button>
      <button class="w-next" on:click={() => handleWheelClick(1)}>⟩⟩</button>
      <button class="w-play" on:click={togglePlay}>⏸/▶</button>
      <button class="w-center" on:click={() => selectMenuItem(menuSelection)}></button>
    </div>
  </div>
</div>

<style>
  :global(body) { background: #0b0f19; margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  .pod-container { display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
  .pod-chassis { width: 380px; height: 620px; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); border-radius: 40px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; padding: 25px 20px; box-sizing: border-box; border: 2px solid #94a3b8; }
  .lcd-screen { width: 100%; height: 260px; background: #f8fafc; color: #0f172a; border-radius: 8px; border: 4px solid #334155; display: flex; flex-direction: column; overflow: hidden; box-shadow: inset 0 4px 8px rgba(0,0,0,0.2); }
  .lcd-header { background: #cbd5e1; padding: 4px 10px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #94a3b8; }
  .lcd-status-right { display: flex; align-items: center; gap: 4px; }
  .lcd-icon { width: 10px; height: 10px; }
  .lcd-battery { width: 14px; height: 14px; }
  .lcd-body { padding: 12px; flex: 1; overflow-y: auto; }
  .menu-title { font-weight: bold; font-size: 13px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 5px 8px; font-size: 13px; border-radius: 4px; cursor: pointer; color: #1e293b; }
  li.selected { background: #38bdf8; color: #fff; font-weight: bold; }
  .coverflow-view { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; cursor: pointer; }
  .coverflow-stack { position: relative; width: 110px; height: 110px; display: flex; justify-content: center; align-items: center; }
  .cover-card { position: absolute; width: 90px; height: 90px; background: #cbd5e1; border-radius: 6px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); overflow: hidden; display: flex; justify-content: center; align-items: center; }
  .active-card { border: 2px solid #38bdf8; }
  .cover-card img { width: 100%; height: 100%; object-fit: cover; }
  .cf-title { font-size: 11px; font-weight: bold; margin-top: 12px; }
  .eq-view { text-align: center; padding-top: 30px; cursor: pointer; }
  .eq-badge { font-size: 16px; font-weight: bold; background: #38bdf8; color: #fff; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-top: 10px; }
  .now-playing { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .album-art { width: 85px; height: 85px; background: #cbd5e1; border-radius: 4px; overflow: hidden; display: flex; justify-content: center; align-items: center; margin-bottom: 6px; border: 1px solid #94a3b8; cursor: pointer; }
  .album-art img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 28px; color: #64748b; }
  .track-title { font-weight: bold; font-size: 12px; margin: 0; }
  .track-artist { color: #475569; font-size: 11px; margin: 2px 0; }
  .click-wheel { width: 210px; height: 210px; background: #f1f5f9; border-radius: 50%; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border: 1px solid #cbd5e1; display: flex; justify-content: center; align-items: center; margin-top: 20px; }
  .click-wheel button { position: absolute; background: transparent; border: none; font-size: 11px; font-weight: bold; color: #475569; cursor: pointer; }
  .w-menu { top: 14px; left: 50%; transform: translateX(-50%); }
  .w-prev { left: 16px; top: 50%; transform: translateY(-50%); }
  .w-next { right: 16px; top: 50%; transform: translateY(-50%); }
  .w-play { bottom: 14px; left: 50%; transform: translateX(-50%); }
  .w-center { width: 75px; height: 75px; background: #e2e8f0; border-radius: 50%; border: 1px solid #cbd5e1; cursor: pointer; }
</style>
