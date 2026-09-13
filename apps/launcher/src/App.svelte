<script>
  import { onMount } from 'svelte';
  import { playClickSound } from '@retropod/core/src/audioEngine.js';

  let currentTime = '';
  let openWindows = { classic: false, touch: false };
  let activeWindow = 'classic';
  
  let windows = {
    classic: { x: 80, y: 60, width: 400, height: 680, opening: false },
    touch: { x: 520, y: 60, width: 380, height: 740, opening: false }
  };
  
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };
  let activeDropdown = null;

  onMount(() => {
    updateClock();
    setInterval(updateClock, 1000);
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
      openWindows[appName] = true;
      setTimeout(() => { windows[appName].opening = false; }, 350);
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
</script>

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
            <div class="dropdown-item">App Store...</div>
          </div>
        {/if}
      </div>

      <div class="menu-dropdown-container">
        <span class="menu-item" on:click={(e) => toggleMenu('file', e)}>File</span>
        {#if activeDropdown === 'file'}
          <div class="dropdown-menu">
            <div class="dropdown-item" on:click={() => toggleWindow('classic')}>New Classic Window</div>
            <div class="dropdown-item" on:click={() => toggleWindow('touch')}>New Touch Window</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" on:click={() => window.location.reload()}>Close All Windows</div>
          </div>
        {/if}
      </div>

      <div class="menu-dropdown-container">
        <span class="menu-item" on:click={(e) => toggleMenu('edit', e)}>Edit</span>
        {#if activeDropdown === 'edit'}
          <div class="dropdown-menu">
            <div class="dropdown-item">Undo</div>
            <div class="dropdown-item">Redo</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item">Cut / Copy / Paste</div>
          </div>
        {/if}
      </div>

      <div class="menu-dropdown-container">
        <span class="menu-item" on:click={(e) => toggleMenu('view', e)}>View</span>
        {#if activeDropdown === 'view'}
          <div class="dropdown-menu">
            <div class="dropdown-item">as Icons</div>
            <div class="dropdown-item">as List</div>
            <div class="dropdown-item">as Columns</div>
          </div>
        {/if}
      </div>

      <div class="menu-dropdown-container">
        <span class="menu-item" on:click={(e) => toggleMenu('window', e)}>Window</span>
        {#if activeDropdown === 'window'}
          <div class="dropdown-menu">
            <div class="dropdown-item" on:click={() => { openWindows.classic = true; activeWindow = 'classic'; }}>Bring Classic to Front</div>
            <div class="dropdown-item" on:click={() => { openWindows.touch = true; activeWindow = 'touch'; }}>Bring Touch to Front</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item">Minimize All</div>
          </div>
        {/if}
      </div>

      <span class="menu-item">Help</span>
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
        <span>RetroPod Classic.app</span>
      </div>
      <div class="desktop-icon" role="button" tabindex="0" on:dblclick={() => toggleWindow('touch')} on:keydown={(e) => e.key === 'Enter' && toggleWindow('touch')}>
        <div class="icon-box ios-device-icon">📱</div>
        <span>RetroPod Touch.app</span>
      </div>
    </div>

    {#if openWindows.classic}
      <div class="mac-window {activeWindow === 'classic' ? 'active-win' : ''} {windows.classic.opening ? 'genie-open' : ''}" 
           style="top: {windows.classic.y}px; left: {windows.classic.x}px; width: {windows.classic.width}px; height: {windows.classic.height}px;" 
           on:mousedown={() => activeWindow = 'classic'}>
        <div class="window-header" on:mousedown={(e) => startDrag('classic', e)}>
          <div class="traffic-lights">
            <span class="close" role="button" tabindex="0" on:click={() => closeWindow('classic')} on:keydown={(e) => e.key === 'Enter' && closeWindow('classic')}></span>
            <span class="minimize" on:click={() => closeWindow('classic')}></span>
            <span class="maximize" on:click={() => windows.classic.width = windows.classic.width === 400 ? 600 : 400}></span>
          </div>
          <span class="window-title">RetroPod Classic — 5th Gen Click Wheel</span>
        </div>
        <div class="window-body">
          <iframe src="/apps/classic/index.html" class="app-frame" title="Classic App"></iframe>
        </div>
      </div>
    {/if}

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
        <div class="window-body">
          <iframe src="/apps/touch/index.html" class="app-frame" title="Touch App"></iframe>
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
        <span>📱</span>
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
  .desktop-icon { width: 80px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s; }
  .desktop-icon:hover { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(10px); }
  
  .icon-box { width: 52px; height: 64px; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 6px; margin-bottom: 4px; box-shadow: 0 6px 15px rgba(0,0,0,0.4); }
  .ipod-classic-icon { background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%); border: 1px solid #cbd5e1; position: relative; }
  .mini-screen { width: 38px; height: 24px; background: #f8fafc; border: 1px solid #334155; border-radius: 3px; margin-bottom: 6px; }
  .mini-wheel { width: 28px; height: 28px; background: #f1f5f9; border-radius: 50%; border: 1px solid #cbd5e1; }
  
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
  .app-frame { width: 100%; height: 100%; border: none; background: transparent; }
  .dock-container { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 1000; }
  .dock { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 8px 12px; display: flex; gap: 12px; align-items: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  .dock-item { width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 26px; cursor: pointer; transition: transform 0.2s; position: relative; }
  .dock-item:hover { transform: scale(1.25) translateY(-6px); }
  .dock-ipod-icon { width: 32px; height: 40px; background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%); border-radius: 6px; display: flex; flex-direction: column; align-items: center; padding-top: 4px; border: 1px solid #cbd5e1; }
  .dock-mini-screen { width: 24px; height: 15px; background: #f8fafc; border: 1px solid #334155; border-radius: 2px; margin-bottom: 4px; }
  .dock-mini-wheel { width: 18px; height: 18px; background: #f1f5f9; border-radius: 50%; border: 1px solid #cbd5e1; }
  .dot { width: 4px; height: 4px; background: #fff; border-radius: 50%; position: absolute; bottom: 3px; }
</style>
