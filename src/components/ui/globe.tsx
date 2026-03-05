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

const GLOBE_RADIUS_FACTOR = 0.4;
const DOT_COUNT = 800;
const ARC_COUNT = 6;
const ROTATION_SPEED = 0.0015;

function latLngToXYZ(lat: number, lng: number, radius: number): { x: number; y: number; z: number } {
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
    "rgba(58, 148, 53, 0.45)",
    "rgba(82, 173, 77, 0.5)",
    "rgba(134, 200, 130, 0.6)",
  ];
  for (let i = 0; i < count; i++) {
    const startIdx = Math.floor(Math.random() * dots.length);
    let endIdx = Math.floor(Math.random() * dots.length);
    while (endIdx === startIdx) endIdx = Math.floor(Math.random() * dots.length);
    arcs.push({
      startDot: dots[startIdx],
      endDot: dots[endIdx],
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.003,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return arcs;
}

function rotateY(x: number, z: number, angle: number): { x: number; z: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - z * sin, z: x * sin + z * cos };
}

export function Globe({ size = 460 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = size;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    ctx.scale(dpr, dpr);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const radius = displaySize * GLOBE_RADIUS_FACTOR;

    const dots = generateDots(DOT_COUNT, radius);
    const arcs = generateArcs(dots, ARC_COUNT);
    let rotation = 0;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, displaySize, displaySize);
      rotation += ROTATION_SPEED;

      // Draw globe outline
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(178, 223, 180, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw dots
      for (const dot of dots) {
        const { x: rx, z: rz } = rotateY(dot.x, dot.z, rotation);
        if (rz < 0) continue;
        const screenX = cx + rx;
        const screenY = cy - dot.y;
        const alpha = 0.15 + (rz / radius) * 0.35;
        const dotSize = 0.8 + (rz / radius) * 0.6;

        ctx.beginPath();
        ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(82, 173, 77, ${alpha})`;
        ctx.fill();
      }

      // Draw arcs
      for (const arc of arcs) {
        arc.progress += arc.speed;
        if (arc.progress > 1) {
          arc.progress = 0;
          const newStart = Math.floor(Math.random() * dots.length);
          let newEnd = Math.floor(Math.random() * dots.length);
          while (newEnd === newStart) newEnd = Math.floor(Math.random() * dots.length);
          arc.startDot = dots[newStart];
          arc.endDot = dots[newEnd];
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
        const midY = (startY + endY) / 2 - 40 - Math.random() * 20;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -arc.progress * 100;
        ctx.stroke();
        ctx.setLineDash([]);

        // Traveling dot
        const t = arc.progress;
        const dotX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
        const dotY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(134, 200, 130, 1)";
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
