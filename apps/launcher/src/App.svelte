<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound, setEqPreset } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';
  import { savePlaylist, getAllPlaylists } from '@retropod/core/src/playlistStore.js';

  let currentTime = '';
  let openWindows = { classic: true, touch: false };
  let activeWindow = 'classic';
  
  let windows = {
    classic: { x: 60, y: 50, width: 380, height: 680, opening: false, minimized: false },
    touch: { x: 480, y: 50, width: 380, height: 740, opening: false, minimized: false }
  };
  
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };
  let activeDropdown = null;

  // Shared Audio & App State
  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  
  // Classic State
  let classicView = 'menu';
  let menuSelection = 0;
  let currentEq = 'Flat';
  let visualizerMode = 0;

  // Touch State
  let touchApp = 'home';

  // Metadata Cache
  let metadataMap = {};

  const menuItems = ['Music Library', '3D Cover Flow', 'Wolfson Parametric EQ', 'Liner Notes & Lyrics', 'Nebula Visualizer', 'Playlists'];
  const eqPresets = ['Flat', 'Rock', 'Bass Booster', 'Acoustic', 'Classical'];
  const touchSpringApps = [
    { id: 'player', name: 'RetroMusic', icon: '🎵', bg: 'music-bg' },
    { id: 'coverflow', name: '3D CoverFlow', icon: '💿', bg: 'cover-bg' },
    { id: 'eq', name: 'Wolfson EQ', icon: '🎚️', bg: 'eq-bg' },
    { id: 'lyrics', name: 'Genie Lyrics', icon: '📜', bg: 'lyrics-bg' },
    { id: 'producer', name: 'Discogs Credits', icon: '🎧', bg: 'producer-bg' },
    { id: 'meaning', name: 'Song Meanings', icon: '💡', bg: 'meaning-bg' },
    { id: 'visualizer', name: 'Nebula Visuals', icon: '✨', bg: 'visualizer-bg' },
    { id: 'playlists', name: 'Playlists', icon: '📑', bg: 'playlist-bg' },
    { id: 'files', name: 'Mount Files', icon: '📁', bg: 'files-bg' }
  ];

  onMount(() => {
    updateClock();
    setInterval(updateClock, 1000);
    if (audioElement) initAudioEngine(audioElement);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('click', () => activeDropdown = null);
  });

  function updateClock() {
    const now = new Date();
    currentTime = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function toggleWindow(appName) {
    playClickSound();
    if (!openWindows[appName]) {
      windows[appName].opening = true;
      windows[appName].minimized = false;
      openWindows[appName] = true;
      setTimeout(() => { windows[appName].opening = false; }, 350);
    } else if (windows[appName].minimized) {
      windows[appName].minimized = false;
    } else {
      openWindows[appName] = false;
    }
    activeWindow = appName;
  }

  function closeWindow(appName) {
    playClickSound();
    openWindows[appName] = false;
  }

  function startDrag(appName, e) {
    if (e.target.closest('.traffic-lights')) return;
    dragging = appName;
    activeWindow = appName;
    const rect = windows[appName];
    dragOffset = { x: e.clientX - rect.x, y: e.clientY - rect.y };
  }

  function onMouseMove(e) {
    if (!dragging) return;
    windows[dragging].x = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
    windows[dragging].y = Math.max(28, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
  }

  function onMouseUp() {
    dragging = null;
  }

  function toggleMenu(menuName, e) {
    e.stopPropagation();
    activeDropdown = activeDropdown === menuName ? null : menuName;
  }

  async function handleOpenDirectory() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      tracks = await scanDirectoryZeroCopy(dirHandle, 'audio', [], (msg) => console.log(msg));
      if (tracks.length > 0) {
        currentIndex = 0;
        loadTrack(currentIndex);
      }
    } catch (e) {
      console.warn('Directory error:', e);
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

    if (!metadataMap[track.title]) {
      fetchMetadata(track);
    }
  }

  async function fetchMetadata(track) {
    try {
      const query = `${track.title || ''} ${track.artist || ''}`.trim();
      const res = await fetch(`/api/metadata?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      metadataMap[track.title] = {
        lyrics: data.lyrics || 'Genius verified lyrics indexed.',
        annotation: data.annotationSummary || 'Genius annotations active.',
        credits: `Discogs Credits:\nMaster Release: ${data.title}\nArtist: ${data.artist}`,
        artUrl: data.songArt || track.artUrl || null
      };
      if (data.songArt && !track.artUrl) {
        track.artUrl = data.songArt;
        tracks = [...tracks];
      }
    } catch (e) {
      metadataMap[track.title] = {
        lyrics: 'Local fallback lyrics.',
        annotation: 'Offline annotation mode.',
        credits: 'Wolfson WM8758 DAC Direct Path',
        artUrl: track.artUrl || null
      };
    }
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

  function handleClassicWheel(dir) {
    playClickSound();
    if (classicView === 'menu') {
      menuSelection = (menuSelection + dir + menuItems.length) % menuItems.length;
    } else if (classicView === 'coverflow' && tracks.length > 0) {
      currentIndex = (currentIndex + dir + tracks.length) % tracks.length;
      loadTrack(currentIndex);
    } else if (classicView === 'eq') {
      let idx = eqPresets.indexOf(currentEq);
      idx = (idx + dir + eqPresets.length) % eqPresets.length;
      currentEq = eqPresets[idx];
      setEqPreset(currentEq);
    } else if (tracks.length > 0) {
      let newIdx = (currentIndex + dir + tracks.length) % tracks.length;
      loadTrack(newIdx);
    }
  }

  function handleClassicCenter() {
    playClickSound();
    if (classicView === 'menu') {
      if (menuSelection === 0) {
        if (tracks.length === 0) handleOpenDirectory();
        else classicView = 'nowPlaying';
      } else if (menuSelection === 1) classicView = 'coverflow';
      else if (menuSelection === 2) classicView = 'eq';
      else if (menuSelection === 3) classicView = 'lyrics';
      else if (menuSelection === 4) classicView = 'visualizer';
      else if (menuSelection === 5) classicView = 'playlists';
    } else {
      classicView = 'menu';
    }
  }

  function openTouchApp(id) {
    playClickSound();
    if (id === 'files') {
      handleOpenDirectory();
    } else {
      touchApp = id;
    }
  }
</script>

<audio bind:this={audioElement} on:ended={() => handleClassicWheel(1)}></audio>

<div class="macos-desktop">
  <div class="menubar">
    <div class="menu-left">
      <span class="apple-logo"></span>
      <div class="menu-dropdown-container">
        <span class="menu-item font-bold" on:click={(e) => toggleMenu('finder', e)}>RetroPod Finder</span>
        {#if activeDropdown === 'finder'}
          <div class="dropdown-menu">
            <div class="dropdown-item" on:click={() => toggleWindow('classic')}>About RetroPod Alpha</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item">System Settings...</div>
          </div>
        {/if}
      </div>

      <div class="menu-dropdown-container">
        <span class="menu-item" on:click={(e) => toggleMenu('file', e)}>File</span>
        {#if activeDropdown === 'file'}
          <div class="dropdown-menu">
            <div class="dropdown-item" on:click={() => toggleWindow('classic')}>New Classic Window</div>
            <div class="dropdown-item" on:click={() => toggleWindow('touch')}>New Touch Window</div>
          </div>
        {/if}
      </div>

      <div class="menu-dropdown-container">
        <span class="menu-item" on:click={(e) => toggleMenu('window', e)}>Window</span>
        {#if activeDropdown === 'window'}
          <div class="dropdown-menu">
            <div class="dropdown-item" on:click={() => { openWindows.classic = true; activeWindow = 'classic'; }}>Bring Classic to Front</div>
            <div class="dropdown-item" on:click={() => { openWindows.touch = true; activeWindow = 'touch'; }}>Bring Touch to Front</div>
          </div>
        {/if}
      </div>
    </div>

    <div class="menu-right">
      <span class="status-icon">🔋 100%</span>
      <span class="status-icon">Wi-Fi</span>
      <span class="clock">{currentTime}</span>
    </div>
  </div>

  <div class="desktop-area">
    <div class="desktop-icons">
      <div class="desktop-icon" role="button" tabindex="0" on:dblclick={() => toggleWindow('classic')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('classic')}>
        <div class="icon-box ipod-classic-icon">
          <div class="mini-screen"></div>
          <div class="mini-wheel"></div>
        </div>
        <span>RetroPod Classic</span>
      </div>
      <div class="desktop-icon" role="button" tabindex="0" on:dblclick={() => toggleWindow('touch')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('touch')}>
        <div class="icon-box ios-device-icon">
          <div class="mini-ios-screen"></div>
          <div class="mini-home-bar"></div>
        </div>
        <span>RetroPod Touch</span>
      </div>
    </div>

    <!-- CLASSIC WINDOW -->
    {#if openWindows.classic}
      <div class="mac-window {activeWindow === 'classic' ? 'active-win' : ''} {windows.classic.opening ? 'genie-open' : ''}" 
           style="top: {windows.classic.y}px; left: {windows.classic.x}px; width: {windows.classic.width}px; height: {windows.classic.height}px;" 
           on:mousedown={() => activeWindow = 'classic'}>
        <div class="window-header" on:mousedown={(e) => startDrag('classic', e)}>
          <div class="traffic-lights">
            <span class="close" role="button" tabindex="0" on:click={() => closeWindow('classic')} on:keydown={(e) => e.key === 'Enter' && closeWindow('classic')}></span>
            <span class="minimize" on:click={() => closeWindow('classic')}></span>
            <span class="maximize" on:click={() => windows.classic.width = windows.classic.width === 380 ? 520 : 380}></span>
          </div>
          <span class="window-title">RetroPod Classic — 5th Gen</span>
        </div>
        
        <div class="window-body classic-chassis">
          <div class="lcd-screen">
            <div class="status-bar">
              <span>RetroPod 5G</span>
              <span>{isPlaying ? '▶' : '⏸'}</span>
            </div>
            <div class="screen-content">
              {#if classicView === 'menu'}
                <div class="menu-title">Audio Suite</div>
                <ul>
                  {#each menuItems as item, idx}
                    <li class={idx === menuSelection ? 'selected' : ''} on:click={() => { menuSelection = idx; handleClassicCenter(); }}>{item}</li>
                  {/each}
                </ul>
              {:else if classicView === 'coverflow'}
                <div class="coverflow-view" on:click={() => handleClassicWheel(1)}>
                  <div class="coverflow-stack">
                    {#each tracks as t, i}
                      <div class="cover-card {i === currentIndex ? 'active-card' : ''}" style="transform: translateX({(i - currentIndex) * 45}px) scale({i === currentIndex ? 1 : 0.85}); z-index: {i === currentIndex ? 10 : 5 - Math.abs(i - currentIndex)};" on:click|stopPropagation={() => loadTrack(i)}>
                        {#if t.artUrl || metadataMap[t.title]?.artUrl}<img src={t.artUrl || metadataMap[t.title]?.artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
                      </div>
                    {/each}
                  </div>
                  <p class="cf-title">{tracks[currentIndex]?.title || 'Empty Library - Tap to Load'}</p>
                </div>
              {:else if classicView === 'eq'}
                <div class="eq-view" on:click={() => handleClassicWheel(1)}>
                  <div class="menu-title">Wolfson Parametric EQ</div>
                  <p class="eq-status">Active Preset:</p>
                  <div class="eq-active-box">{currentEq}</div>
                  <p class="hint">Click to Cycle Presets</p>
                </div>
              {:else if classicView === 'lyrics'}
                <div class="lyrics-view scrollable-text">
                  <div class="menu-title">Liner Notes & Lyrics</div>
                  <p><strong>Track:</strong> {tracks[currentIndex]?.title || 'N/A'}</p>
                  <pre>{metadataMap[tracks[currentIndex]?.title]?.lyrics || 'Loading Genius lyrics...'}</pre>
                </div>
              {:else if classicView === 'visualizer'}
                <div class="visualizer-mini-wrap" on:click={() => visualizerMode = (visualizerMode + 1) % 3}>
                  <div class="vis-box">Nebula Visualizer Mode {visualizerMode}</div>
                </div>
              {:else if classicView === 'playlists'}
                <div class="lyrics-view scrollable-text">
                  <div class="menu-title">Playlists</div>
                  <p>Playlists managed via browser storage.</p>
                  <button class="glass-btn-sm" on:click={handleOpenDirectory}>Mount Music Folder</button>
                </div>
              {:else}
                <div class="now-playing" on:click={handleOpenDirectory}>
                  <div class="album-art">
                    {#if tracks[currentIndex]?.artUrl || metadataMap[tracks[currentIndex]?.title]?.artUrl}<img src={tracks[currentIndex]?.artUrl || metadataMap[tracks[currentIndex]?.title]?.artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
                  </div>
                  <p class="t-title">{tracks[currentIndex]?.title || 'No Track Selected'}</p>
                  <p class="t-artist">{tracks[currentIndex]?.artist || 'Click Art to Mount Folder'}</p>
                </div>
              {/if}
            </div>
          </div>

          <div class="click-wheel">
            <button class="btn-menu" on:click={() => classicView = 'menu'}>MENU</button>
            <button class="btn-prev" on:click={() => handleClassicWheel(-1)}>⟨⟨</button>
            <button class="btn-next" on:click={() => handleClassicWheel(1)}>⟩⟩</button>
            <button class="btn-play" on:click={togglePlay}>⏸/▶</button>
            <button class="btn-center" on:click={handleClassicCenter}></button>
          </div>
        </div>
      </div>
    {/if}

    <!-- TOUCH WINDOW -->
    {#if openWindows.touch}
      <div class="mac-window {activeWindow === 'touch' ? 'active-win' : ''} {windows.touch.opening ? 'genie-open' : ''}" 
           style="top: {windows.touch.y}px; left: {windows.touch.x}px; width: {windows.touch.width}px; height: {windows.touch.height}px;" 
           on:mousedown={() => activeWindow = 'touch'}>
        <div class="window-header" on:mousedown={(e) => startDrag('touch', e)}>
          <div class="traffic-lights">
            <span class="close" role="button" tabindex="0" on:click={() => closeWindow('touch')} on:keydown={(e) => e.key === 'Enter' && closeWindow('touch')}></span>
            <span class="minimize" on:click={() => closeWindow('touch')}></span>
            <span class="maximize" on:click={() => windows.touch.width = windows.touch.width === 380 ? 500 : 380}></span>
          </div>
          <span class="window-title">RetroPod Touch — iOS SpringBoard</span>
        </div>
        
        <div class="window-body ios-screen-wrap">
          <div class="ios-status-bar">
            <span>2:18 AM</span>
            {#if touchApp !== 'home'}
              <button class="back-home-pill" on:click={() => touchApp = 'home'}>‹ SpringBoard</button>
            {/if}
            <span>5G 🔋 100%</span>
          </div>

          <div class="ios-viewport">
            {#if touchApp === 'home'}
              <div class="springboard-grid">
                {#each touchSpringApps as app}
                  <div class="app-tile" on:click={() => openTouchApp(app.id)}>
                    <div class="tile-icon {app.bg}">{app.icon}</div>
                    <span>{app.name}</span>
                  </div>
                {/each}
              </div>

              <div class="ios-glass-dock">
                <div class="app-tile" on:click={() => openTouchApp('player')}>
                  <div class="tile-icon music-bg dock-icon">🎵</div>
                </div>
                <div class="app-tile" on:click={() => openTouchApp('coverflow')}>
                  <div class="tile-icon cover-bg dock-icon">💿</div>
                </div>
                <div class="app-tile" on:click={() => openTouchApp('visualizer')}>
                  <div class="tile-icon visualizer-bg dock-icon">✨</div>
                </div>
              </div>

            {:else if touchApp === 'player'}
              <div class="app-inner-view">
                <div class="glass-album-art">
                  {#if tracks[currentIndex]?.artUrl || metadataMap[tracks[currentIndex]?.title]?.artUrl}
                    <img src={tracks[currentIndex]?.artUrl || metadataMap[tracks[currentIndex]?.title]?.artUrl} alt="Art" />
                  {:else}
                    <div class="no-art">♪</div>
                  {/if}
                </div>
                <div class="track-meta-block">
                  <h2>{tracks[currentIndex]?.title || 'No Track Loaded'}</h2>
                  <p class="artist-sub">{tracks[currentIndex]?.artist || 'Mount Files via SpringBoard'}</p>
                </div>
                
                <div class="playback-controls">
                  <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex - 1 + tracks.length) % tracks.length); }}>⏮</button>
                  <button class="play-big-btn" on:click={togglePlay}>{isPlaying ? '❚❚' : '▶'}</button>
                  <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}>⏭</button>
                </div>
              </div>

            {:else if touchApp === 'coverflow'}
              <div class="app-inner-view">
                <h3 class="app-title">3D Cover Flow Carousel</h3>
                <div class="coverflow-stage">
                  {#each tracks as t, i}
                    <div class="cf-glass-card {i === currentIndex ? 'cf-active' : ''}" style="transform: translateX({(i - currentIndex) * 65}px) scale({i === currentIndex ? 1 : 0.82}); z-index: {i === currentIndex ? 10 : 5 - Math.abs(i - currentIndex)};" on:click={() => loadTrack(i)}>
                      {#if t.artUrl || metadataMap[t.title]?.artUrl}<img src={t.artUrl || metadataMap[t.title]?.artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
                    </div>
                  {/each}
                </div>
                <p class="cf-label">{tracks[currentIndex]?.title || 'Select track'}</p>
              </div>

            {:else if touchApp === 'eq'}
              <div class="app-inner-view">
                <h3 class="app-title">Wolfson Parametric EQ</h3>
                <div class="eq-preset-list">
                  {#each eqPresets as preset}
                    <button class="glass-btn {currentEq === preset ? 'eq-active' : ''}" on:click={() => { currentEq = preset; setEqPreset(preset); playClickSound(); }}>{preset}</button>
                  {/each}
                </div>
              </div>

            {:else if touchApp === 'lyrics'}
              <div class="app-inner-view scrollable">
                <h3 class="app-title">Genie Verified Lyrics</h3>
                <div class="glass-panel">
                  <pre>{metadataMap[tracks[currentIndex]?.title]?.lyrics || 'Loading Genius API lyrics...'}</pre>
                </div>
              </div>

            {:else if touchApp === 'producer'}
              <div class="app-inner-view scrollable">
                <h3 class="app-title">Discogs Credits</h3>
                <div class="glass-panel">
                  <pre>{metadataMap[tracks[currentIndex]?.title]?.credits || 'Loading credits...'}</pre>
                </div>
              </div>

            {:else if touchApp === 'meaning'}
              <div class="app-inner-view scrollable">
                <h3 class="app-title">Song Meanings</h3>
                <div class="glass-panel">
                  <pre>{metadataMap[tracks[currentIndex]?.title]?.annotation || 'Loading annotations...'}</pre>
                </div>
              </div>

            {:else if touchApp === 'visualizer'}
              <div class="app-inner-view">
                <div class="vis-mode-bar">
                  <button class="glass-btn" on:click={() => visualizerMode = (visualizerMode + 1) % 3}>Nebula Mode: {visualizerMode}</button>
                </div>
                <div class="vis-active-display">✨ Active Visualizer Stream ✨</div>
              </div>

            {:else if touchApp === 'playlists'}
              <div class="app-inner-view scrollable">
                <h3 class="app-title">Playlist Manager</h3>
                <button class="glass-btn" on:click={handleOpenDirectory}>Mount Local Directory</button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="dock-container">
    <div class="dock">
      <div class="dock-item" role="button" tabindex="0" title="RetroPod Classic" on:click={() => toggleWindow('classic')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('classic')}>
        <div class="dock-ipod-icon">
          <div class="dock-mini-screen"></div>
          <div class="dock-mini-wheel"></div>
        </div>
        {#if openWindows.classic}<div class="dot"></div>{/if}
      </div>
      <div class="dock-item" role="button" tabindex="0" title="RetroPod Touch" on:click={() => toggleWindow('touch')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('touch')}>
        <div class="dock-iphone-icon">
          <div class="dock-mini-ios-screen"></div>
        </div>
        {#if openWindows.touch}<div class="dot"></div>{/if}
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) { margin: 0; padding: 0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; background: #000; user-select: none; }
  .macos-desktop { width: 100vw; height: 100vh; background: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop') center/cover no-repeat; display: flex; flex-direction: column; position: relative; }
  .menubar { height: 28px; background: rgba(30, 30, 30, 0.45); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.15); display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 13px; color: #f3f3f3; z-index: 1000; }
  .menu-left, .menu-right { display: flex; align-items: center; gap: 16px; }
  .apple-logo { font-size: 15px; font-weight: bold; }
  .menu-dropdown-container { position: relative; }
  .menu-item { cursor: pointer; opacity: 0.85; transition: opacity 0.2s; padding: 2px 6px; border-radius: 4px; }
  .menu-item:hover { opacity: 1; background: rgba(255, 255, 255, 0.15); }
  .font-bold { font-weight: 600; opacity: 1; }
  .dropdown-menu { position: absolute; top: 26px; left: 0; width: 200px; background: rgba(40, 40, 40, 0.85); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); padding: 6px; z-index: 2000; display: flex; flex-direction: column; gap: 2px; }
  .dropdown-item { padding: 6px 10px; font-size: 12px; border-radius: 4px; color: #f3f3f3; cursor: pointer; }
  .dropdown-item:hover { background: #0060df; color: #fff; }
  .dropdown-divider { height: 1px; background: rgba(255, 255, 255, 0.15); margin: 4px 0; }
  .status-icon, .clock { font-size: 12px; opacity: 0.9; }

  .desktop-area { flex: 1; position: relative; padding: 20px; overflow: hidden; }
  .desktop-icons { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
  .desktop-icon { width: 90px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s; }
  .desktop-icon:hover { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(10px); }
  
  .icon-box { width: 52px; height: 68px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 5px 0; margin-bottom: 4px; box-shadow: 0 6px 15px rgba(0,0,0,0.4); box-sizing: border-box; }
  .ipod-classic-icon { background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%); border: 1px solid #cbd5e1; justify-content: flex-start; padding-top: 6px; }
  .mini-screen { width: 38px; height: 22px; background: #f8fafc; border: 1px solid #334155; border-radius: 3px; margin-bottom: 6px; }
  .mini-wheel { width: 26px; height: 26px; background: #f1f5f9; border-radius: 50%; border: 1px solid #cbd5e1; }
  
  .ios-device-icon { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; }
  .mini-ios-screen { width: 40px; height: 50px; background: linear-gradient(135deg, #31103f 0%, #1e1b4b 100%); border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); }
  .mini-home-bar { width: 16px; height: 2px; background: rgba(255,255,255,0.6); border-radius: 1px; }

  .desktop-icon span { font-size: 11px; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8); line-height: 1.2; }

  .mac-window { position: absolute; background: rgba(22, 22, 22, 0.85); backdrop-filter: blur(40px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 30px 60px rgba(0,0,0,0.6); display: flex; flex-direction: column; overflow: hidden; z-index: 10; transform-origin: bottom center; }
  .genie-open { animation: genieOpen 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes genieOpen {
    0% { transform: scale(0.1) translateY(400px); opacity: 0; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  .active-win { z-index: 50; box-shadow: 0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.25); }
  .window-header { height: 36px; background: rgba(45, 45, 45, 0.6); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; padding: 0 12px; position: relative; cursor: grab; }
  .window-header:active { cursor: grabbing; }
  .traffic-lights { display: flex; gap: 8px; }
  .traffic-lights span { width: 12px; height: 12px; border-radius: 50%; display: inline-block; cursor: pointer; }
  .close { background: #ff5f56; border: 1px solid #e0443e; }
  .minimize { background: #ffbd2e; border: 1px solid #dea123; }
  .maximize { background: #27c93f; border: 1px solid #1aab29; }
  .window-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.85); }
  
  .window-body { flex: 1; background: #000; overflow: hidden; display: flex; }
  
  /* Classic Styles inside Window */
  .classic-chassis { background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); flex-direction: column; align-items: center; padding: 20px; box-sizing: border-box; justify-content: space-between; }
  .lcd-screen { width: 100%; height: 260px; background: #f8fafc; color: #0f172a; border-radius: 8px; border: 4px solid #334155; display: flex; flex-direction: column; overflow: hidden; box-shadow: inset 0 4px 8px rgba(0,0,0,0.2); position: relative; }
  .status-bar { background: #cbd5e1; padding: 4px 10px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; border-bottom: 1px solid #94a3b8; color: #1e293b; }
  .screen-content { padding: 12px; flex: 1; overflow-y: auto; }
  .menu-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; color: #0f172a; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 5px 8px; font-size: 13px; border-radius: 4px; color: #1e293b; cursor: pointer; }
  li.selected { background: #38bdf8; color: #fff; font-weight: bold; }
  .coverflow-view { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; position: relative; cursor: pointer; }
  .coverflow-stack { position: relative; width: 120px; height: 120px; display: flex; justify-content: center; align-items: center; }
  .cover-card { position: absolute; width: 95px; height: 95px; background: #cbd5e1; border-radius: 6px; box-shadow: 0 10px 20px rgba(0,0,0,0.4); transition: transform 0.3s ease; overflow: hidden; display: flex; justify-content: center; align-items: center; cursor: pointer; }
  .active-card { box-shadow: 0 15px 30px rgba(56,189,248,0.6); border: 2px solid #38bdf8; }
  .cover-card img { width: 100%; height: 100%; object-fit: cover; }
  .cf-title { font-size: 11px; font-weight: bold; margin-top: 15px; text-align: center; color: #0f172a; }
  .eq-view { text-align: center; padding-top: 20px; cursor: pointer; }
  .eq-active-box { font-size: 18px; font-weight: bold; background: #38bdf8; color: #fff; padding: 8px; border-radius: 6px; margin: 10px 0; }
  .hint { font-size: 10px; color: #64748b; }
  .scrollable-text { font-size: 11px; color: #334155; line-height: 1.4; overflow-y: auto; max-height: 190px; }
  .scrollable-text pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
  .now-playing { display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; }
  .album-art { width: 80px; height: 80px; background: #cbd5e1; border-radius: 4px; overflow: hidden; display: flex; justify-content: center; align-items: center; margin-bottom: 6px; border: 1px solid #94a3b8; }
  .album-art img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 28px; color: #64748b; }
  .t-title { font-weight: bold; font-size: 12px; color: #0f172a; margin: 0; }
  .t-artist { color: #475569; font-size: 11px; margin: 2px 0; }
  
  .click-wheel { width: 210px; height: 210px; background: #f1f5f9; border-radius: 50%; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border: 1px solid #cbd5e1; display: flex; justify-content: center; align-items: center; }
  .click-wheel button { position: absolute; background: transparent; border: none; font-size: 11px; font-weight: bold; color: #475569; cursor: pointer; }
  .btn-menu { top: 14px; left: 50%; transform: translateX(-50%); }
  .btn-prev { left: 18px; top: 50%; transform: translateY(-50%); }
  .btn-next { right: 18px; top: 50%; transform: translateY(-50%); }
  .btn-play { bottom: 14px; left: 50%; transform: translateX(-50%); }
  .btn-center { width: 80px; height: 80px; background: #e2e8f0; border-radius: 50%; border: 1px solid #cbd5e1; cursor: pointer; }

  /* Touch Styles inside Window */
  .ios-screen-wrap { background: linear-gradient(135deg, #2e1065 0%, #1e1b4b 50%, #0f172a 100%); flex-direction: column; justify-content: space-between; position: relative; color: #fff; }
  .ios-status-bar { height: 36px; display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 12px; font-weight: 600; background: rgba(0,0,0,0.25); backdrop-filter: blur(20px); z-index: 30; }
  .back-home-pill { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #38bdf8; padding: 2px 10px; border-radius: 12px; cursor: pointer; font-size: 10px; font-weight: bold; }
  .ios-viewport { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 12px; overflow: hidden; position: relative; }
  .springboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 6px; }
  .app-tile { display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 4px; text-align: center; font-size: 10px; color: #f1f5f9; font-weight: 500; }
  .tile-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; justify-content: center; align-items: center; font-size: 22px; box-shadow: 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.2); transition: transform 0.2s; }
  .tile-icon:hover { transform: scale(1.08); }
  .music-bg { background: linear-gradient(135deg, #f43f5e, #be123c); }
  .cover-bg { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
  .eq-bg { background: linear-gradient(135deg, #06b6d4, #0e7490); }
  .lyrics-bg { background: linear-gradient(135deg, #10b981, #047857); }
  .producer-bg { background: linear-gradient(135deg, #f59e0b, #b45309); }
  .meaning-bg { background: linear-gradient(135deg, #ec4899, #be185d); }
  .visualizer-bg { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .playlist-bg { background: linear-gradient(135deg, #6366f1, #4338ca); }
  .files-bg { background: linear-gradient(135deg, #14b8a6, #0f766e); }
  .ios-glass-dock { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(30px); border-radius: 24px; padding: 8px 16px; display: flex; justify-content: space-around; align-items: center; border: 1px solid rgba(255, 255, 255, 0.25); box-shadow: 0 15px 30px rgba(0,0,0,0.4); }
  .dock-icon { width: 42px; height: 42px; font-size: 18px; }
  .app-inner-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 10px; padding: 6px; }
  .scrollable { overflow-y: auto; align-items: stretch; text-align: left; }
  .app-title { font-size: 14px; font-weight: bold; margin: 0 0 6px 0; color: #38bdf8; text-align: center; }
  .玻璃-album-art, .glass-album-art { width: 140px; height: 140px; border-radius: 16px; background: rgba(15, 23, 42, 0.7); overflow: hidden; display: flex; justify-content: center; align-items: center; position: relative; box-shadow: 0 15px 30px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); }
  .glass-album-art img { width: 100%; height: 100%; object-fit: cover; }
  .track-meta-block h2 { font-size: 15px; font-weight: 700; margin: 0 0 2px 0; color: #fff; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .artist-sub { font-size: 12px; color: #94a3b8; margin: 0; }
  .playback-controls { display: flex; gap: 22px; align-items: center; margin-top: 6px; }
  .playback-controls button { background: none; border: none; font-size: 22px; color: #fff; cursor: pointer; }
  .play-big-btn { font-size: 32px !important; color: #38bdf8 !important; }
  .coverflow-stage { position: relative; width: 100%; height: 130px; display: flex; justify-content: center; align-items: center; }
  .cf-glass-card { position: absolute; width: 100px; height: 100px; background: rgba(30, 41, 59, 0.8); border-radius: 10px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.5); transition: transform 0.3s; display: flex; justify-content: center; align-items: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); }
  .cf-active { border: 2px solid #38bdf8; }
  .cf-glass-card img { width: 100%; height: 100%; object-fit: cover; }
  .cf-label { font-size: 11px; font-weight: bold; color: #e2e8f0; margin-top: 8px; }
  .eq-preset-list { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 200px; margin: 0 auto; }
  .glass-btn { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; }
  .eq-active { background: #38bdf8 !important; color: #0f172a !important; }
  .glass-panel { background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(20px); padding: 10px; border-radius: 10px; font-size: 11px; line-height: 1.4; border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; }
  .glass-panel pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
  .glass-btn-sm { background: #38bdf8; color: #0f172a; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px; }

  /* Dock */
  .dock-container { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 1000; }
  .dock { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 8px 12px; display: flex; gap: 12px; align-items: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  .dock-item { width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 26px; cursor: pointer; transition: transform 0.2s; position: relative; }
  .dock-item:hover { transform: scale(1.25) translateY(-6px); }
  .dock-ipod-icon { width: 32px; height: 40px; background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%); border-radius: 6px; display: flex; flex-direction: column; align-items: center; padding-top: 4px; border: 1px solid #cbd5e1; }
  .dock-mini-screen { width: 24px; height: 15px; background: #f8fafc; border: 1px solid #334155; border-radius: 2px; margin-bottom: 4px; }
  .dock-mini-wheel { width: 18px; height: 18px; background: #f1f5f9; border-radius: 50%; border: 1px solid #cbd5e1; }
  .dock-iphone-icon { width: 28px; height: 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #334155; }
  .dock-mini-ios-screen { width: 22px; height: 32px; background: linear-gradient(135deg, #31103f 0%, #1e1b4b 100%); border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); }
  .dot { width: 4px; height: 4px; background: #fff; border-radius: 50%; position: absolute; bottom: 3px; }
</style>
