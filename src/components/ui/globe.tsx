"use client";

import { useRef, useEffect, useCallback } from "react";

interface GlobeProps {
  size?: number;
}

interface Dot {
  lat: number;
  lng: number;
  x: number;
  y: number;
  z: number;
}

interface Arc {
  startDot: Dot;
  endDot: Dot;
  midOffsetY: number;
  progress: number;
  speed: number;
  color: string;
}

const GLOBE_RADIUS_FACTOR = 0.40;
const DOT_COUNT = 1400;
const ARC_COUNT = 10;
const ROTATION_SPEED = 0.0008;

function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function generateDots(count: number, radius: number): Dot[] {
  const dots: Dot[] = [];
  // Fibonacci sphere for even distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const lat = Math.asin(y) * (180 / Math.PI);
    const lng = ((theta * 180) / Math.PI) % 360 - 180;
    const pos = latLngToXYZ(lat, lng, radius);
    dots.push({ lat, lng, ...pos });
  }
  return dots;
}

function makeArc(dots: Dot[]): Arc {
  const ARC_COLORS = [
    "rgba(99,102,241,0.50)",
    "rgba(129,140,248,0.40)",
    "rgba(139,92,246,0.45)",
    "rgba(167,139,250,0.35)",
  ];
  const si = Math.floor(Math.random() * dots.length);
  let ei = Math.floor(Math.random() * dots.length);
  while (ei === si) ei = Math.floor(Math.random() * dots.length);
  return {
    startDot: dots[si],
    endDot: dots[ei],
    midOffsetY: 28 + Math.random() * 40,
    progress: Math.random(),
    speed: 0.0012 + Math.random() * 0.0025,
    color: ARC_COLORS[Math.floor(Math.random() * ARC_COLORS.length)],
  };
}

function rotateY(x: number, z: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - z * sin, z: x * sin + z * cos };
}

export function Globe({ size = 480 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * GLOBE_RADIUS_FACTOR;

    const dots = generateDots(DOT_COUNT, radius);
    const arcs: Arc[] = Array.from({ length: ARC_COUNT }, () => makeArc(dots));
    let rotation = 0;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      rotation += ROTATION_SPEED;

      // Atmospheric glow
      const atmo = ctx.createRadialGradient(cx, cy, radius * 0.80, cx, cy, radius * 1.30);
      atmo.addColorStop(0, "rgba(99,102,241,0.07)");
      atmo.addColorStop(0.6, "rgba(139,92,246,0.04)");
      atmo.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.30, 0, Math.PI * 2);
      ctx.fillStyle = atmo;
      ctx.fill();

      // Globe edge ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(99,102,241,0.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dots — back hemisphere first (painter's algorithm)
      const frontDots: { screenX: number; screenY: number; depth: number }[] = [];
      for (const dot of dots) {
        const { x: rx, z: rz } = rotateY(dot.x, dot.z, rotation);
        const screenX = cx + rx;
        const screenY = cy - dot.y;
        const depth = (rz + radius) / (2 * radius); // 0=back, 1=front

        if (rz < 0) {
          // Back hemisphere — very faint
          const alpha = 0.04 + depth * 0.06;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99,102,241,${alpha})`;
          ctx.fill();
        } else {
          frontDots.push({ screenX, screenY, depth });
        }
      }

      // Front hemisphere dots — brighter
      for (const { screenX, screenY, depth } of frontDots) {
        const alpha = 0.15 + depth * 0.55;
        const dotSize = 0.7 + depth * 0.85;
        ctx.beginPath();
        ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${alpha})`;
        ctx.fill();
      }

      // Arcs
      for (const arc of arcs) {
        arc.progress += arc.speed;
        if (arc.progress > 1) {
          arc.progress = 0;
          Object.assign(arc, makeArc(dots));
        }

        const s = arc.startDot;
        const e = arc.endDot;
        const { x: sx, z: sz } = rotateY(s.x, s.z, rotation);
        const { x: ex, z: ez } = rotateY(e.x, e.z, rotation);

        if (sz < -radius * 0.5 && ez < -radius * 0.5) continue;

        const startX = cx + sx;
        const startY = cy - s.y;
        const endX = cx + ex;
        const endY = cy - e.y;

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 - arc.midOffsetY;

        // Trail arc
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = arc.color.replace(/[\d.]+\)$/, "0.18)");
        ctx.lineWidth = 0.8;
        ctx.setLineDash([]);
        ctx.stroke();

        // Animated portion
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -(arc.progress * 200);
        ctx.stroke();
        ctx.setLineDash([]);

        // Traveling dot
        const t = arc.progress;
        const dotX = (1-t)*(1-t)*startX + 2*(1-t)*t*midX + t*t*endX;
        const dotY = (1-t)*(1-t)*startY + 2*(1-t)*t*midY + t*t*endY;

        const glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 7);
        glow.addColorStop(0, "rgba(129,140,248,0.7)");
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(199,210,254,0.95)";
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  }, [size]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{ width: size, height: size }}
    />
  );
}
