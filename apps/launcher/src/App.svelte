<script>
  import { playClickSound } from '@retropod/core/src/audioEngine.js';

  function launchDevice(path) {
    playClickSound();
    window.location.href = path;
  }
</script>

<div class="lineup-container">
  <h1>RetroPod Hardware Lineage</h1>
  <p>Select an authentic media player device instance to mount standalone:</p>

  <div class="device-grid">
    <div class="device-card" role="button" tabindex="0" on:click={() => launchDevice('/apps/shuffle/index.html')} on:keydown={(e) => e.key === 'Enter' && launchDevice('/apps/shuffle/index.html')}>
      <div class="device-icon shuffle-icon"></div>
      <h3>iPod shuffle</h3>
      <span>4th Gen Clip-on</span>
    </div>

    <div class="device-card" role="button" tabindex="0" on:click={() => launchDevice('/apps/nano/index.html')} on:keydown={(e) => e.key === 'Enter' && launchDevice('/apps/nano/index.html')}>
      <div class="device-icon nano-icon"></div>
      <h3>iPod nano</h3>
      <span>3rd Gen Curved</span>
    </div>

    <div class="device-card" role="button" tabindex="0" on:click={() => launchDevice('/apps/classic/index.html')} on:keydown={(e) => e.key === 'Enter' && launchDevice('/apps/classic/index.html')}>
      <div class="device-icon classic-icon"></div>
      <h3>iPod classic</h3>
      <span>5th Gen Click Wheel</span>
    </div>

    <div class="device-card" role="button" tabindex="0" on:click={() => launchDevice('/apps/touch/index.html')} on:keydown={(e) => e.key === 'Enter' && launchDevice('/apps/touch/index.html')}>
      <div class="device-icon touch-icon"></div>
      <h3>iPod touch</h3>
      <span>iOS SpringBoard Glass</span>
    </div>
  </div>
</div>

<style>
  :global(body) { margin: 0; padding: 0; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; }
  .lineup-container { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; max-width: 900px; padding: 20px; }
  h1 { font-size: 28px; font-weight: 700; margin: 0; color: #38bdf8; text-shadow: 0 2px 10px rgba(56,189,248,0.4); }
  p { font-size: 14px; color: #94a3b8; margin: 0 0 20px 0; }
  .device-grid { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
  .device-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px; padding: 24px; width: 170px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.25s, background 0.25s, box-shadow 0.25s; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
  .device-card:hover { transform: translateY(-8px) scale(1.03); background: rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px rgba(56,189,248,0.3); border-color: #38bdf8; }
  .device-icon { width: 64px; height: 90px; border-radius: 10px; margin-bottom: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); }
  .shuffle-icon { background: linear-gradient(135deg, #cbd5e1, #64748b); width: 64px; height: 64px; border-radius: 14px; }
  .nano-icon { background: linear-gradient(135deg, #f43f5e, #be123c); }
  .classic-icon { background: linear-gradient(135deg, #e2e8f0, #94a3b8); }
  .touch-icon { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.2); }
  .device-card h3 { font-size: 15px; font-weight: bold; margin: 0 0 4px 0; color: #fff; }
  .device-card span { font-size: 11px; color: #64748b; }
</style>
