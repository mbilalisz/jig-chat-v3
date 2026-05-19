import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Avatar } from "./Avatar";

interface AvatarViewerProps {
  src?: string;
  alt?: string;
  fallback?: string;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.3;

export const AvatarViewer: React.FC<AvatarViewerProps> = ({ src, alt, fallback, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const reset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => clampScale(s - e.deltaY * 0.001));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const next = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y };
    positionRef.current = next;
    setPosition(next);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.touches[0].clientX - positionRef.current.x,
      y: e.touches[0].clientY - positionRef.current.y,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const next = {
      x: e.touches[0].clientX - dragStart.current.x,
      y: e.touches[0].clientY - dragStart.current.y,
    };
    positionRef.current = next;
    setPosition(next);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Image container — stops click propagation so clicking image doesn't close */}
      <div
        className="relative select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging.current ? "none" : "transform 0.15s ease",
          cursor: scale > 1 ? (isDragging.current ? "grabbing" : "grab") : "default",
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { isDragging.current = false; }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover shadow-2xl ring-4 ring-white/20"
            draggable={false}
          />
        ) : (
          <Avatar
            src={src}
            alt={alt}
            fallback={fallback}
            className="w-64 h-64 md:w-80 md:h-80 text-6xl shadow-2xl ring-4 ring-white/20"
          />
        )}
      </div>

      {/* Name label */}
      {alt && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-[15px] font-semibold drop-shadow-lg pointer-events-none">
          {alt}
        </div>
      )}

      {/* Controls */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setScale((s) => clampScale(s - ZOOM_STEP))}
          className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>

        <span className="text-white text-[13px] font-semibold w-12 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={() => setScale((s) => clampScale(s + ZOOM_STEP))}
          className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>

        <div className="w-px h-5 bg-white/20" />

        <button
          onClick={reset}
          className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
        title="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
};
