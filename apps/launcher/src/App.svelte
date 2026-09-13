<script>
  import { onMount } from 'svelte';
  import { playClickSound } from '@retropod/core/src/audioEngine.js';

  let currentTime = '';
  let openWindows = {
    classic: false,
    touch: false,
    visualizer: false
  };
  let activeWindow = null;

  onMount(() => {
    updateClock();
    setInterval(updateClock, 1000);
  });

  function updateClock() {
    const now = new Date();
    currentTime = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function toggleWindow(appName) {
    playClickSound();
    openWindows[appName] = !openWindows[appName];
    if (openWindows[appName]) activeWindow = appName;
  }

  function closeWindow(appName) {
    playClickSound();
    openWindows[appName] = false;
  }
</script>

<div class="macos-desktop">
  <!-- Top Menu Bar -->
  <div class="menubar">
    <div class="menu-left">
      <span class="apple-logo"></span>
      <span class="menu-item font-bold">RetroPod Finder</span>
      <span class="menu-item">File</span>
      <span class="menu-item">Edit</span>
      <span class="menu-item">View</span>
      <span class="menu-item">Window</span>
      <span class="menu-item">Help</span>
    </div>
    <div class="menu-right">
      <span class="status-icon">🔋 100%</span>
      <span class="status-icon">Wi-Fi</span>
      <span class="clock">{currentTime}</span>
    </div>
  </div>

  <!-- Desktop Workspace Area -->
  <div class="desktop-area" on:click={() => activeWindow = null}>
    <!-- Desktop Icons -->
    <div class="desktop-icons">
      <div class="desktop-icon" role="button" tabindex="0" on:dblclick={() => toggleWindow('classic')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('classic')}>
        <div class="icon-box">🎛️</div>
        <span>RetroPod Classic.app</span>
      </div>
      <div class="desktop-icon" role="button" tabindex="0" on:dblclick={() => toggleWindow('touch')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('touch')}>
        <div class="icon-box">📱</div>
        <span>RetroPod Touch.app</span>
      </div>
      <div class="desktop-icon" role="button" tabindex="0" on:dblclick={() => toggleWindow('visualizer')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('visualizer')}>
        <div class="icon-box">✨</div>
        <span>Nebula Visualizer.app</span>
      </div>
    </div>

    <!-- RetroPod Classic Window -->
    {#if openWindows.classic}
      <div class="mac-window {activeWindow === 'classic' ? 'active-win' : ''}" style="top: 80px; left: 100px; width: 420px; height: 680px;" on:mousedown={() => activeWindow = 'classic'}>
        <div class="window-header">
          <div class="traffic-lights">
            <span class="close" role="button" tabindex="0" on:click={() => closeWindow('classic')} on:keydown={(e) => e.key === 'Enter' && closeWindow('classic')}></span>
            <span class="minimize"></span>
            <span class="maximize"></span>
          </div>
          <span class="window-title">RetroPod Classic — 5th Gen Click Wheel</span>
        </div>
        <div class="window-body">
          <iframe src="/apps/classic/index.html" class="app-frame" title="Classic App"></iframe>
        </div>
      </div>
    {/if}

    <!-- RetroPod Touch Window -->
    {#if openWindows.touch}
      <div class="mac-window {activeWindow === 'touch' ? 'active-win' : ''}" style="top: 60px; left: 560px; width: 380px; height: 740px;" on:mousedown={() => activeWindow = 'touch'}>
        <div class="window-header">
          <div class="traffic-lights">
            <span class="close" role="button" tabindex="0" on:click={() => closeWindow('touch')} on:keydown={(e) => e.key === 'Enter' && closeWindow('touch')}></span>
            <span class="minimize"></span>
            <span class="maximize"></span>
          </div>
          <span class="window-title">RetroPod Touch — iOS SpringBoard</span>
        </div>
        <div class="window-body">
          <iframe src="/apps/touch/index.html" class="app-frame" title="Touch App"></iframe>
        </div>
      </div>
    {/if}
  </div>

  <!-- macOS Dock -->
  <div class="dock-container">
    <div class="dock">
      <div class="dock-item" role="button" tabindex="0" title="RetroPod Classic" on:click={() => toggleWindow('classic')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('classic')}>
        <span>🎛️</span>
        {#if openWindows.classic}<div class="dot"></div>{/if}
      </div>
      <div class="dock-item" role="button" tabindex="0" title="RetroPod Touch" on:click={() => toggleWindow('touch')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('touch')}>
        <span>📱</span>
        {#if openWindows.touch}<div class="dot"></div>{/if}
      </div>
      <div class="dock-separator"></div>
      <div class="dock-item" role="button" tabindex="0" title="Finder / Files" on:click={() => alert('Use individual apps to mount directory handles.')} on:keydown={(e) => e.key === 'Enter' && alert('Use individual apps to mount directory handles.')}>
        <span>📁</span>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) { margin: 0; padding: 0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif; background: #000; user-select: none; }
  .macos-desktop { width: 100vw; height: 100vh; background: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop') center/cover no-repeat; display: flex; flex-direction: column; position: relative; }
  .menubar { height: 28px; background: rgba(30, 30, 30, 0.45); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.15); display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 13px; color: #f3f3f3; z-index: 1000; }
  .menu-left, .menu-right { display: flex; align-items: center; gap: 16px; }
  .apple-logo { font-size: 15px; font-weight: bold; }
  .menu-item { cursor: pointer; opacity: 0.85; transition: opacity 0.2s; }
  .menu-item:hover { opacity: 1; }
  .font-bold { font-weight: 600; opacity: 1; }
  .status-icon, .clock { font-size: 12px; opacity: 0.9; }
  .desktop-area { flex: 1; position: relative; padding: 20px; overflow: hidden; }
  .desktop-icons { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
  .desktop-icon { width: 80px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s; }
  .desktop-icon:hover { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(10px); }
  .icon-box { font-size: 36px; margin-bottom: 4px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); }
  .desktop-icon span { font-size: 11px; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8); line-height: 1.2; }
  .mac-window { position: absolute; background: rgba(22, 22, 22, 0.75); backdrop-filter: blur(40px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 30px 60px rgba(0,0,0,0.6); display: flex; flex-direction: column; overflow: hidden; z-index: 10; transition: box-shadow 0.2s; }
  .active-win { z-index: 50; box-shadow: 0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.25); }
  .window-header { height: 36px; background: rgba(45, 45, 45, 0.5); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; padding: 0 12px; position: relative; }
  .traffic-lights { display: flex; gap: 8px; }
  .traffic-lights span { width: 12px; height: 12px; border-radius: 50%; display: inline-block; cursor: pointer; }
  .close { background: #ff5f56; border: 1px solid #e0443e; }
  .minimize { background: #ffbd2e; border: 1px solid #dea123; }
  .maximize { background: #27c93f; border: 1px solid #1aab29; }
  .window-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.85); }
  .window-body { flex: 1; background: #000; overflow: hidden; display: flex; }
  .app-frame { width: 100%; height: 100%; border: none; background: transparent; }
  .dock-container { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 1000; }
  .dock { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 8px 12px; display: flex; gap: 12px; align-items: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  .dock-item { width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 26px; cursor: pointer; transition: transform 0.2s; position: relative; }
  .dock-item:hover { transform: scale(1.25) translateY(-6px); }
  .dot { width: 4px; height: 4px; background: #fff; border-radius: 50%; position: absolute; bottom: 3px; }
  .dock-separator { width: 1px; height: 32px; background: rgba(255, 255, 255, 0.25); margin: 0 4px; }
</style>
