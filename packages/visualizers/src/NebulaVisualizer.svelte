<script>
  import { onMount, onDestroy } from 'svelte';
  import { getAudioSpectrum } from '@retropod/core/src/audioEngine.js';

  export let isPlaying = false;
  export let currentTrack = null;
  export let visualizerMode = 0; // 0: Cosmic Plasma, 1: Aurora Wave, 2: Stellar Quantum Field

  let canvasElem;
  let animationId;

  const modes = ['Cosmic Plasma Nebula', 'Aurora Borealis Soundwave', 'Stellar Quantum Field'];

  onMount(() => {
    const dataArray = new Uint8Array(64);
    let time = 0;
    let particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 4 + 1,
      colorHue: Math.random() * 60 + 180
    }));

    function draw() {
      animationId = requestAnimationFrame(draw);
      if (!canvasElem) return;
      const ctx = canvasElem.getContext('2d');
      const width = canvasElem.width = window.innerWidth;
      const height = canvasElem.height = window.innerHeight;

      ctx.fillStyle = 'rgba(4, 6, 15, 0.18)';
      ctx.fillRect(0, 0, width, height);

      let bass = 0;
      if (isPlaying && getAudioSpectrum(dataArray)) {
        for (let i = 0; i < 6; i++) bass += dataArray[i];
        bass /= 6;
      }

      time += 0.01 + (bass / 255) * 0.015;
      const pulse = 1 + (bass / 255) * 0.8;

      if (visualizerMode === 0) {
        const cx = width / 2;
        const cy = height / 2;
        for (let r = 1; r <= 7; r++) {
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${(time * 30 + r * 35) % 360}, 90%, 60%, 0.35)`;
          ctx.lineWidth = 3 + (bass / 20);
          let radius = (r * 90) * pulse;
          for (let a = 0; a < Math.PI * 2; a += 0.05) {
            let wave = Math.sin(a * 6 + time * 2) * (15 + bass * 0.2);
            let px = cx + Math.cos(a + time * 0.2) * (radius + wave);
            let py = cy + Math.sin(a + time * 0.2) * (radius + wave);
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      } else if (visualizerMode === 1) {
        ctx.lineWidth = 2.5;
        for (let wave = 0; wave < 5; wave++) {
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${120 + wave * 45 + time * 20}, 100%, 60%, 0.45)`;
          for (let x = 0; x < width; x += 12) {
            let freqIndex = Math.floor((x / width) * 32);
            let val = dataArray[freqIndex] || 0;
            let y = height * 0.5 + Math.sin(x * 0.005 + time + wave * 0.5) * (80 + val * 1.2);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        particles.forEach(p => {
          p.x += p.vx * pulse;
          p.y += p.vy * pulse;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.fillStyle = `hsla(${(p.colorHue + time * 40) % 360}, 100%, 70%, 0.8)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + bass / 100), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`NEBULA LIGHT SHOW: ${modes[visualizerMode]}`, 30, 40);
      if (currentTrack) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.fillText(`Now Playing: ${currentTrack.title} — ${currentTrack.artist}`, 30, 65);
      }
    }
    draw();
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
  });
</script>

<canvas bind:this={canvasElem} class="nebula-canvas"></canvas>

<style>
  .nebula-canvas {
    width: 100vw; height: 100vh; display: block; background: #04060f; position: fixed; top: 0; left: 0; z-index: 10;
  }
</style>
