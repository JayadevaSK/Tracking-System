import React, { useEffect, useRef } from 'react';

const COLORS = ['#6c63ff', '#00d4aa', '#a855f7', '#f472b6', '#3b82f6', '#06b6d4', '#8b5cf6'];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
  glowSize: number;
  trail: Array<{ x: number; y: number }>;
  trailLen: number;
}

interface Star {
  x: number; y: number;
  vx: number; vy: number;
  len: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Orb {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  color: string;
  alpha: number;
  phase: number;
  phaseSpeed: number;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // ── Particles ──────────────────────────────────────────
    const COUNT = Math.min(Math.floor((W * H) / 9000), 120);
    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const r = Math.random() * 2.2 + 0.6;
      const a = Math.random() * 0.55 + 0.15;
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: r, baseRadius: r,
        alpha: a, baseAlpha: a,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.025 + 0.008,
        glowSize: Math.random() * 12 + 6,
        trail: [],
        trailLen: Math.floor(Math.random() * 8) + 4,
      };
    });

    // ── Shooting stars ─────────────────────────────────────
    const stars: Star[] = [];
    const spawnStar = () => {
      const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
      const speed = Math.random() * 8 + 5;
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 1,
        len: Math.random() * 120 + 60,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    };

    // ── Orbs ───────────────────────────────────────────────
    const orbs: Orb[] = [
      { x: W*0.12, y: H*0.12, vx: 0.15, vy: 0.10, radius: 380, color: '#6c63ff', alpha: 0.09, phase: 0, phaseSpeed: 0.008 },
      { x: W*0.82, y: H*0.18, vx:-0.12, vy: 0.13, radius: 300, color: '#a855f7', alpha: 0.08, phase: 1, phaseSpeed: 0.006 },
      { x: W*0.78, y: H*0.82, vx:-0.10, vy:-0.09, radius: 340, color: '#00d4aa', alpha: 0.08, phase: 2, phaseSpeed: 0.007 },
      { x: W*0.18, y: H*0.78, vx: 0.09, vy:-0.11, radius: 260, color: '#f472b6', alpha: 0.06, phase: 3, phaseSpeed: 0.009 },
      { x: W*0.50, y: H*0.45, vx: 0.06, vy: 0.07, radius: 420, color: '#3b82f6', alpha: 0.05, phase: 4, phaseSpeed: 0.005 },
    ];

    // ── Draw orbs ──────────────────────────────────────────
    const drawOrbs = () => {
      orbs.forEach((orb) => {
        orb.phase += orb.phaseSpeed;
        const breathe = 1 + Math.sin(orb.phase) * 0.12;
        const r = Math.max(0.01, orb.radius * breathe);
        const a = orb.alpha * (0.85 + Math.sin(orb.phase * 1.3) * 0.15);
        const hex = Math.round(Math.min(a, 1) * 255).toString(16).padStart(2, '0');
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
        grad.addColorStop(0, orb.color + hex);
        grad.addColorStop(0.4, orb.color + Math.round(a * 0.5 * 255).toString(16).padStart(2, '0'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // ── Draw particles with glow + trails ─────────────────
    const drawParticles = () => {
      particles.forEach((p) => {
        // Trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = p.color + '22';
          ctx.lineWidth = p.radius * 0.8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Outer glow
        const safeGlow = Math.max(0.01, p.glowSize);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, safeGlow);
        const aHex = Math.round(p.alpha * 0.4 * 255).toString(16).padStart(2, '0');
        glow.addColorStop(0, p.color + aHex);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        const coreA = Math.round(Math.min(p.alpha, 1) * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
        ctx.fillStyle = p.color + coreA;
        ctx.fill();
      });
    };

    // ── Draw connections ───────────────────────────────────
    const drawConnections = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const PDIST = 130;
      const MDIST = 200;

      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];

        // Mouse lines with gradient
        const mdx = mx - pi.x, mdy = my - pi.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MDIST && mouse.current.active) {
          const a = (1 - md / MDIST) * 0.6;
          const grad = ctx.createLinearGradient(pi.x, pi.y, mx, my);
          grad.addColorStop(0, pi.color + Math.round(a * 255).toString(16).padStart(2, '0'));
          grad.addColorStop(1, '#6c63ff' + Math.round(a * 0.8 * 255).toString(16).padStart(2, '0'));
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Particle connections
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const dx = pi.x - pj.x, dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < PDIST) {
            const a = (1 - dist / PDIST) * 0.22;
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(108,99,255,${a})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    // ── Draw shooting stars ────────────────────────────────
    const drawStars = () => {
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life++;
        s.alpha = 1 - s.life / s.maxLife;
        if (s.alpha <= 0) { stars.splice(i, 1); continue; }

        const tailX = s.x - s.vx * (s.len / 10);
        const tailY = s.y - s.vy * (s.len / 10);
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, s.color + Math.round(s.alpha * 255).toString(16).padStart(2, '0'));
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Star head glow
        const hGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
        hGlow.addColorStop(0, s.color + Math.round(s.alpha * 255).toString(16).padStart(2, '0'));
        hGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = hGlow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fill();

        s.x += s.vx;
        s.y += s.vy;
      }
    };

    // ── Update particles ───────────────────────────────────
    const updateParticles = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Rebuild density map every frame
      rebuildDensity();

      particles.forEach((p) => {
        p.pulse += p.pulseSpeed;
        p.radius = Math.max(0.1, p.baseRadius + Math.sin(p.pulse) * 0.7);
        p.alpha = Math.max(0.05, p.baseAlpha + Math.sin(p.pulse * 0.7) * 0.12);
        p.glowSize = Math.max(0.01, (p.baseRadius * 4) + Math.sin(p.pulse * 1.3) * 3);

        // Steer toward empty space
        const { fx, fy } = emptinessForce(p);
        p.vx += fx;
        p.vy += fy;

        // Mouse repulsion
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }

        p.vx *= 0.97;
        p.vy *= 0.97;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 2) { p.vx = (p.vx / speed) * 2; p.vy = (p.vy / speed) * 2; }

        // Trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.trailLen) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
      });
    };

    const updateOrbs = () => {
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x - orb.radius < -200 || orb.x + orb.radius > W + 200) orb.vx *= -1;
        if (orb.y - orb.radius < -200 || orb.y + orb.radius > H + 200) orb.vy *= -1;
      });
    };

    // ── Density grid for empty-space coverage ─────────────
    const CELL = 80; // grid cell size in px
    let COLS = Math.ceil(W / CELL);
    let ROWS = Math.ceil(H / CELL);
    // density[row][col] = particle count in that cell
    let density: number[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

    const rebuildDensity = () => {
      COLS = Math.ceil(W / CELL);
      ROWS = Math.ceil(H / CELL);
      density = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
      particles.forEach((p) => {
        const col = Math.min(Math.floor(p.x / CELL), COLS - 1);
        const row = Math.min(Math.floor(p.y / CELL), ROWS - 1);
        density[row][col]++;
      });
    };

    // Returns the direction vector toward the emptiest nearby region
    const emptinessForce = (p: Particle): { fx: number; fy: number } => {
      const col = Math.min(Math.floor(p.x / CELL), COLS - 1);
      const row = Math.min(Math.floor(p.y / CELL), ROWS - 1);
      let fx = 0, fy = 0;
      let minDensity = Infinity;
      let bestDx = 0, bestDy = 0;

      // Scan 5x5 neighbourhood
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          const d = density[nr][nc];
          if (d < minDensity) {
            minDensity = d;
            bestDx = dc;
            bestDy = dr;
          }
        }
      }

      // Only steer if the emptiest cell is less dense than current
      const currentDensity = density[row][col];
      if (minDensity < currentDensity - 1 && (bestDx !== 0 || bestDy !== 0)) {
        const len = Math.sqrt(bestDx * bestDx + bestDy * bestDy);
        const strength = Math.min((currentDensity - minDensity) * 0.004, 0.06);
        fx = (bestDx / len) * strength;
        fy = (bestDy / len) * strength;
      }

      return { fx, fy };
    };


    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = W;
    gridCanvas.height = H;
    const gCtx = gridCanvas.getContext('2d')!;
    gCtx.fillStyle = 'rgba(255,255,255,0.028)';
    const spacing = 36;
    for (let gx = 0; gx < W; gx += spacing) {
      for (let gy = 0; gy < H; gy += spacing) {
        gCtx.beginPath();
        gCtx.arc(gx, gy, 0.9, 0, Math.PI * 2);
        gCtx.fill();
      }
    }

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Base
      ctx.fillStyle = '#060818';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.drawImage(gridCanvas, 0, 0);

      // Orbs
      drawOrbs();
      updateOrbs();

      // Shooting stars (spawn ~every 90 frames)
      if (frame % 90 === 0 && Math.random() > 0.3) spawnStar();
      drawStars();

      // Particles
      updateParticles();
      drawConnections();
      drawParticles();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999, active: false };
    };
    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      gridCanvas.width = W;
      gridCanvas.height = H;
      gCtx.fillStyle = 'rgba(255,255,255,0.028)';
      for (let gx = 0; gx < W; gx += spacing) {
        for (let gy = 0; gy < H; gy += spacing) {
          gCtx.beginPath();
          gCtx.arc(gx, gy, 0.9, 0, Math.PI * 2);
          gCtx.fill();
        }
      }
      rebuildDensity();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'block' }}
    />
  );
};

export default AnimatedBackground;
