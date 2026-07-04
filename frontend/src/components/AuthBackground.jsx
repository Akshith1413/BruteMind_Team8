import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

export default function AuthBackground() {
  const canvasRef = useRef(null);
  const theme = useAuthStore((state) => state.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates tracker
    const mouse = { x: -2000, y: -2000, targetX: -2000, targetY: -2000, radius: 250 };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -2000;
      mouse.targetY = -2000;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Colors mapping based on active theme
    const getColors = () => {
      if (theme === 'light') {
        return {
          bg: '#f4f6fa',
          grid: 'rgba(2, 132, 199, 0.02)',
          hud: 'rgba(2, 132, 199, 0.06)',
          text: 'rgba(15, 23, 42, 0.4)',
          colors: ['rgba(2, 132, 199, 0.28)', 'rgba(13, 148, 136, 0.25)', 'rgba(124, 58, 237, 0.2)'],
        };
      } else {
        return {
          bg: '#06070d',
          grid: 'rgba(0, 242, 254, 0.015)',
          hud: 'rgba(0, 242, 254, 0.04)',
          text: 'rgba(0, 242, 254, 0.5)',
          colors: ['rgba(0, 242, 254, 0.35)', 'rgba(127, 0, 255, 0.3)', 'rgba(236, 72, 153, 0.22)'],
        };
      }
    };

    let colors = getColors();

    // Generate filaments
    const filamentCount = 75;
    const filaments = [];

    for (let i = 0; i < filamentCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      filaments.push({
        history: Array.from({ length: 15 }, () => ({ x, y })),
        x,
        y,
        vx: 0,
        vy: 0,
        speedFactor: 0.5 + Math.random() * 0.8,
        colorIdx: Math.floor(Math.random() * colors.colors.length),
        angleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Static clinical grid indicators
    const huds = [];
    for (let i = 0; i < 6; i++) {
      huds.push({
        x: Math.random() * (width - 150) + 50,
        y: Math.random() * (height - 100) + 50,
        text: `BIO_GRID_${Math.floor(Math.random() * 900 + 100)}: SECURE`,
        val: (Math.random() * 100).toFixed(1),
      });
    }

    let time = 0;

    // Main animation render frame loop
    const animate = () => {
      // Clear canvas with trail smear effect
      ctx.fillStyle = theme === 'light' ? 'rgba(244, 246, 252, 0.18)' : 'rgba(6, 7, 13, 0.18)';
      ctx.fillRect(0, 0, width, height);

      time += 0.003;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Draw faint background grid
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw background clinical indicators
      ctx.font = '8px "Share Tech Mono"';
      ctx.fillStyle = colors.text;
      huds.forEach((hud) => {
        // Draw crosshair at point
        ctx.beginPath();
        ctx.moveTo(hud.x - 4, hud.y); ctx.lineTo(hud.x + 4, hud.y);
        ctx.moveTo(hud.x, hud.y - 4); ctx.lineTo(hud.x, hud.y + 4);
        ctx.stroke();

        ctx.fillText(hud.text, hud.x + 8, hud.y - 2);
        ctx.fillText(`VAL: ${((parseFloat(hud.val) + Math.sin(time * 5) * 2)).toFixed(1)}%`, hud.x + 8, hud.y + 8);
      });

      // Update and draw filaments
      filaments.forEach((f) => {
        // Generative Flow-field vectors using trigonometric waves
        const nX = f.x * 0.003;
        const nY = f.y * 0.003;
        
        let flowAngle = Math.sin(nX + time) * Math.cos(nY - time) * Math.PI * 2;
        flowAngle += f.angleOffset * 0.1; // Add individual trait variation

        let ax = Math.cos(flowAngle) * 0.15;
        let ay = Math.sin(flowAngle) * 0.15;

        // Mouse vortex swirling physics
        if (mouse.x > -500) {
          const dx = mouse.x - f.x;
          const dy = mouse.y - f.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Perpendicular force for swirling vortex around the cursor
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            ax += Math.cos(angle) * force * 1.8;
            ay += Math.sin(angle) * force * 1.8;
          }
        }

        // Apply acceleration & drag
        f.vx = (f.vx + ax) * 0.95;
        f.vy = (f.vy + ay) * 0.95;

        // Apply velocities
        f.x += f.vx * f.speedFactor;
        f.y += f.vy * f.speedFactor;

        // Boundary wrap-around
        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;
        if (f.y < 0) f.y = height;
        if (f.y > height) f.y = 0;

        // Update history chain for smooth trails
        f.history.shift();
        f.history.push({ x: f.x, y: f.y });

        // Draw flowing path trail
        ctx.beginPath();
        ctx.moveTo(f.history[0].x, f.history[0].y);
        for (let i = 1; i < f.history.length; i++) {
          // Prevent drawing line wrap-around jumps
          const d = Math.hypot(f.history[i].x - f.history[i-1].x, f.history[i].y - f.history[i-1].y);
          if (d < 150) {
            ctx.lineTo(f.history[i].x, f.history[i].y);
          } else {
            ctx.moveTo(f.history[i].x, f.history[i].y);
          }
        }

        // Filament styling (color and dynamic thickness)
        ctx.strokeStyle = colors.colors[f.colorIdx];
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Draw a tiny glowing head node
        ctx.beginPath();
        ctx.arc(f.x, f.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = colors.colors[f.colorIdx].replace('0.35', '0.8').replace('0.28', '0.8');
        ctx.fill();
      });

      // Draw faint mouse HUD locator ring
      if (mouse.x > -500) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.hud;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    colors = getColors();
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
