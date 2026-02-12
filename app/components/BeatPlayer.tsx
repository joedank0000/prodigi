"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, Volume2, VolumeX, ShoppingCart, Wand2 } from "lucide-react";
import { Beat } from "../lib/beats";

interface BeatPlayerProps {
  beat: Beat;
  index: number;
  onAddToCart: () => void;
}

// ─── Waveform Visualiser (static decorative bars) ─────────────────────────────
function Waveform({ progress, isPlaying }: { progress: number; isPlaying: boolean }) {
  const bars = 48;
  // Pre-computed heights give a realistic waveform silhouette
  const heights = [
    20, 40, 30, 60, 45, 70, 55, 80, 35, 65, 50, 75, 30, 55, 70, 45,
    85, 40, 60, 75, 50, 30, 65, 80, 45, 70, 55, 40, 75, 60, 35, 65,
    50, 80, 45, 30, 70, 55, 60, 40, 75, 35, 65, 50, 80, 45, 30, 55,
  ];

  return (
    <div className="flex items-center gap-0.5 h-10 w-full">
      {Array.from({ length: bars }).map((_, i) => {
        const filled = (i / bars) * 100 <= progress;
        const h = (heights[i % heights.length] / 100) * 40;
        return (
          <motion.div
            key={i}
            className="rounded-full flex-1"
            style={{
              height: `${h}px`,
              minWidth: "2px",
              background: filled ? "#D4AF37" : "rgba(255,255,255,0.08)",
              transition: "background 0.1s",
            }}
            animate={
              isPlaying && filled
                ? { scaleY: [1, 1.15, 0.9, 1.05, 1], transition: { duration: 0.4 + (i % 5) * 0.1, repeat: Infinity } }
                : { scaleY: 1 }
            }
          />
        );
      })}
    </div>
  );
}

// ─── Key Badge ─────────────────────────────────────────────────────────────────
const KEY_COLORS: Record<string, string> = {
  major: "rgba(212,175,55,0.15)",
  minor: "rgba(139,0,0,0.2)",
};

function KeyBadge({ keyName }: { keyName: string }) {
  const isMajor = keyName.toLowerCase().includes("major");
  const bg = isMajor ? KEY_COLORS.major : KEY_COLORS.minor;
  const color = isMajor ? "#D4AF37" : "#e05555";
  return (
    <span
      className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 border"
      style={{ background: bg, color, borderColor: color + "44" }}
    >
      {keyName}
    </span>
  );
}

// ─── Time display ──────────────────────────────────────────────────────────────
function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BeatPlayer({ beat, index, onAddToCart }: BeatPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [hasAudio] = useState(!!beat.audioUrl);

  // Initialise audio element
  useEffect(() => {
    if (!hasAudio) return;
    const audio = new Audio(beat.audioUrl);
    audio.volume = volume;
    audio.preload = "metadata";

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    });
    audio.addEventListener("ended", () => { setIsPlaying(false); setProgress(0); });

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat.audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const val = parseFloat(e.target.value);
    const time = (val / 100) * audio.duration;
    audio.currentTime = time;
    setProgress(val);
    setCurrentTime(time);
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (val > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  const handleAddToCart = () => {
    onAddToCart();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Suit cycling for decorative corners
  const suits: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"];
  const suit = suits[index % suits.length];
  const suitColor = suit === "♥" || suit === "♦" ? "#8b0000" : "#D4AF37";

  return (
    <motion.div
      layout
      className="relative border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 transition-colors duration-300 overflow-hidden group"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(10,10,10,0.8) 100%)",
      }}
      whileHover={{ backgroundColor: "rgba(212,175,55,0.02)" }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-300"
        style={{
          background: isPlaying
            ? "linear-gradient(to bottom, transparent, #D4AF37, transparent)"
            : "transparent",
          boxShadow: isPlaying ? "0 0 8px #D4AF37" : "none",
        }}
      />

      {/* Corner decorations */}
      <span
        className="absolute top-2.5 left-2.5 text-[9px] font-bold opacity-30"
        style={{ color: suitColor, fontFamily: "serif" }}
      >
        {suit}
      </span>
      <span
        className="absolute bottom-2.5 right-2.5 text-[9px] font-bold opacity-30 rotate-180"
        style={{ color: suitColor, fontFamily: "serif" }}
      >
        {suit}
      </span>

      {/* Track number */}
      <div className="absolute top-2.5 right-3 text-[9px] text-white/15 font-mono font-bold">
        #{String(index + 1).padStart(2, "0")}
      </div>

      <div className="p-4 md:p-5">
        {/* Row 1: Play button + Title + Metadata */}
        <div className="flex items-start gap-4">
          {/* Play/Pause button */}
          <motion.button
            onClick={togglePlay}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center border transition-all duration-200"
            style={{
              borderColor: isPlaying ? "#D4AF37" : "rgba(212,175,55,0.3)",
              background: isPlaying ? "rgba(212,175,55,0.12)" : "transparent",
              boxShadow: isPlaying ? "0 0 20px rgba(212,175,55,0.15)" : "none",
            }}
            title={hasAudio ? (isPlaying ? "Pause" : "Play preview") : "No audio available"}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <Pause size={18} className="text-[#D4AF37]" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <Play size={18} className="text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors" fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulsing ring when playing */}
            {isPlaying && (
              <motion.div
                className="absolute inset-0 border border-[#D4AF37]/30"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>

          {/* Beat info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3
                  className="text-xl md:text-2xl font-black text-white leading-none tracking-tight mb-1 group-hover:text-[#D4AF37] transition-colors duration-200"
                  style={{ fontFamily: "'Bebas Neue', cursive" }}
                >
                  {beat.title}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
                    {beat.bpm} BPM
                  </span>
                  <span className="text-white/15">·</span>
                  <KeyBadge keyName={beat.key} />
                  {beat.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] text-white/25 uppercase tracking-widest hidden sm:inline"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price + Cart */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className="text-[#D4AF37] font-black text-xl"
                  style={{ fontFamily: "'Bebas Neue', cursive" }}
                >
                  ${beat.price.toFixed(2)}
                </span>
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 overflow-hidden"
                  style={{
                    border: "1px solid",
                    borderColor: addedToCart ? "#D4AF37" : "rgba(212,175,55,0.3)",
                    background: addedToCart ? "rgba(212,175,55,0.15)" : "transparent",
                    color: addedToCart ? "#D4AF37" : "rgba(212,175,55,0.6)",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {addedToCart ? (
                      <motion.span
                        key="added"
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        className="flex items-center gap-1"
                      >
                        <Wand2 size={11} />
                        ADDED
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        className="flex items-center gap-1"
                      >
                        <ShoppingCart size={11} />
                        <span className="hidden sm:inline">LICENSE</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Waveform + Seek */}
        <div className="mt-4 px-0">
          <div className="relative">
            <Waveform progress={progress} isPlaying={isPlaying} />
            {/* Invisible seek input over waveform */}
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onChange={seek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              disabled={!hasAudio}
              style={{ height: "100%" }}
              title="Seek"
            />
          </div>
        </div>

        {/* Row 3: Controls bar */}
        <div className="flex items-center gap-4 mt-3">
          {/* Restart */}
          <button
            onClick={restart}
            className="text-white/25 hover:text-white/60 transition-colors"
            title="Restart"
            disabled={!hasAudio}
          >
            <SkipBack size={13} />
          </button>

          {/* Time */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/30">
            <span className={isPlaying ? "text-[#D4AF37]/70" : ""}>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex-1" />

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <div className="w-16 md:w-24 relative flex items-center">
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: `${muted ? 0 : volume * 100}%`,
                  height: "2px",
                  background: "#D4AF37",
                  pointerEvents: "none",
                }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="w-full relative z-10"
                title="Volume"
              />
            </div>
          </div>

          {/* No-audio indicator */}
          {!hasAudio && (
            <span className="text-[9px] text-white/20 uppercase tracking-widest hidden md:block">
              Preview N/A
            </span>
          )}
        </div>
      </div>

      {/* Playing indicator line at bottom */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-[#D4AF37]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            style={{ transition: "width 0.1s linear" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
