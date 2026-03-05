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
  progress: number;
  speed: number;
  color: string;
}

const GLOBE_RADIUS_FACTOR = 0.38;
const DOT_COUNT = 900;
const ARC_COUNT = 8;
const ROTATION_SPEED = 0.001;

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
  for (let i = 0; i < count; i++) {
    const lat = Math.asin(2 * Math.random() - 1) * (180 / Math.PI);
    const lng = Math.random() * 360 - 180;
    const { x, y, z } = latLngToXYZ(lat, lng, radius);
    dots.push({ lat, lng, x, y, z });
  }
  return dots;
}

function generateArcs(dots: Dot[], count: number): Arc[] {
  const arcs: Arc[] = [];
  const colors = [
    "rgba(34, 197, 94, 0.35)",
    "rgba(74, 222, 128, 0.30)",
    "rgba(14, 165, 233, 0.25)",
    "rgba(124, 58, 237, 0.20)",
  ];
  for (let i = 0; i < count; i++) {
    const startIdx = Math.floor(Math.random() * dots.length);
    let endIdx = Math.floor(Math.random() * dots.length);
    while (endIdx === startIdx) endIdx = Math.floor(Math.random() * dots.length);
    arcs.push({
      startDot: dots[startIdx],
      endDot: dots[endIdx],
      progress: Math.random(),
      speed: 0.0015 + Math.random() * 0.003,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return arcs;
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
    const arcs = generateArcs(dots, ARC_COUNT);
    let rotation = 0;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      rotation += ROTATION_SPEED;

      // Outer glow ring
      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.2);
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.04)");
      gradient.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Globe outline
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dots
      for (const dot of dots) {
        const { x: rx, z: rz } = rotateY(dot.x, dot.z, rotation);
        if (rz < 0) continue;
        const screenX = cx + rx;
        const screenY = cy - dot.y;
        const depth = rz / radius;
        const alpha = 0.06 + depth * 0.22;
        const dotSize = 0.5 + depth * 0.7;

        ctx.beginPath();
        ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.fill();
      }

      // Arcs
      for (const arc of arcs) {
        arc.progress += arc.speed;
        if (arc.progress > 1) {
          arc.progress = 0;
          const ns = Math.floor(Math.random() * dots.length);
          let ne = Math.floor(Math.random() * dots.length);
          while (ne === ns) ne = Math.floor(Math.random() * dots.length);
          arc.startDot = dots[ns];
          arc.endDot = dots[ne];
        }

        const s = arc.startDot;
        const e = arc.endDot;
        const { x: sx, z: sz } = rotateY(s.x, s.z, rotation);
        const { x: ex, z: ez } = rotateY(e.x, e.z, rotation);

        if (sz < -radius * 0.3 && ez < -radius * 0.3) continue;

        const startX = cx + sx;
        const startY = cy - s.y;
        const endX = cx + ex;
        const endY = cy - e.y;

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 - 30 - Math.random() * 30;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.lineDashOffset = -arc.progress * 80;
        ctx.stroke();
        ctx.setLineDash([]);

        // Traveling dot with glow
        const t = arc.progress;
        const dotX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
        const dotY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

        // Glow
        const glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
        glow.addColorStop(0, "rgba(74, 222, 128, 0.5)");
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(74, 222, 128, 0.9)";
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
