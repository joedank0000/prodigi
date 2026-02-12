"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ShoppingCart, X, Volume2, VolumeX, Play, Pause, SkipBack,
  SkipForward, ChevronDown, Zap, Package, Shirt, Music,
  Star, Trophy, Flame, Crown, Diamond, Plus, Minus, Trash2,
} from "lucide-react";
import BeatPlayer from "./components/BeatPlayer";
import { loadBeatsFromManifest, Beat } from "./lib/beats";
import { CartItem, StripeCheckoutUtil } from "./lib/stripeCheckout";

// ─── STATIC DATA ────────────────────────────────────────────────────────────

const DRUMKITS = [
  {
    id: "dk-001",
    title: "INFERNO 808 KIT",
    subtitle: "Trap / Drill Percussion Pack",
    price: 29.99,
    tags: ["808s", "Trap", "Drill", "Claps"],
    image: "🔥",
    badge: "BESTSELLER",
    files: "247 Files / WAV",
  },
  {
    id: "dk-002",
    title: "VELVET NOIR KIT",
    subtitle: "Lo-Fi / Jazz Drum Textures",
    price: 24.99,
    tags: ["Lo-Fi", "Jazz", "Vinyl", "Warm"],
    image: "🎷",
    badge: "NEW DROP",
    files: "189 Files / WAV",
  },
  {
    id: "dk-003",
    title: "CHROME GOD KIT",
    subtitle: "Afrobeats / Amapiano Rhythms",
    price: 34.99,
    tags: ["Afrobeats", "Amapiano", "Perc"],
    image: "💎",
    badge: "LIMITED",
    files: "312 Files / WAV",
  },
];

const MERCH = [
  {
    id: "m-001",
    title: "JACKPOT HOODIE",
    subtitle: "Heavy-weight fleece / Embroidered",
    price: 89.99,
    image: "🎰",
    sizes: ["S", "M", "L", "XL", "XXL"],
    badge: "HOT",
  },
  {
    id: "m-002",
    title: "DEALER TEE",
    subtitle: "100% Cotton / Screen printed",
    price: 44.99,
    image: "🃏",
    sizes: ["XS", "S", "M", "L", "XL"],
    badge: null,
  },
  {
    id: "m-003",
    title: "HIGH ROLLER CAP",
    subtitle: "6-panel structured / Embroidered",
    price: 54.99,
    image: "👑",
    sizes: ["One Size"],
    badge: "COLLAB",
  },
];

// ─── DEMO BEATS (used when no manifest exists) ───────────────────────────────

const DEMO_BEATS: Beat[] = [
  {
    id: "beat-001",
    title: "BLOOD MONEY",
    folder: "blood-money",
    audioUrl: "",
    bpm: 140,
    key: "F# Minor",
    price: 29.99,
    tags: ["Dark", "Trap", "Hard"],
  },
  {
    id: "beat-002",
    title: "GOLDEN HOUR",
    folder: "golden-hour",
    audioUrl: "",
    bpm: 95,
    key: "A Major",
    price: 34.99,
    tags: ["Melodic", "R&B", "Lush"],
  },
  {
    id: "beat-003",
    title: "ROULETTE",
    folder: "roulette",
    audioUrl: "",
    bpm: 128,
    key: "D Minor",
    price: 24.99,
    tags: ["Club", "Drill", "Bass"],
  },
  {
    id: "beat-004",
    title: "DIAMOND TEETH",
    folder: "diamond-teeth",
    audioUrl: "",
    bpm: 145,
    key: "C# Minor",
    price: 39.99,
    tags: ["Trap", "808", "Premium"],
  },
  {
    id: "beat-005",
    title: "LUCKY SEVEN",
    folder: "lucky-seven",
    audioUrl: "",
    bpm: 85,
    key: "G Major",
    price: 19.99,
    tags: ["Lo-Fi", "Smooth", "Chill"],
  },
  {
    id: "beat-006",
    title: "ACE OF SPADES",
    folder: "ace-of-spades",
    audioUrl: "",
    bpm: 160,
    key: "B Minor",
    price: 44.99,
    tags: ["Drill", "UK", "Dark", "Elite"],
  },
];

// ─── UTILITY COMPONENTS ──────────────────────────────────────────────────────

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.035]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

function GoldScribble({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute pointer-events-none ${className}`} viewBox="0 0 120 40" fill="none">
      <path
        d="M5 20 Q15 8 25 20 Q35 32 45 20 Q55 8 65 20 Q75 32 85 20 Q95 8 105 20 Q115 32 118 18"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
        style={{ filter: "url(#roughen)" }}
      />
      <defs>
        <filter id="roughen">
          <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>
    </svg>
  );
}

function GlitchText({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span
        className="absolute inset-0 text-[#8b0000] opacity-60"
        style={{ clipPath: "polygon(0 30%, 100% 30%, 100% 50%, 0 50%)", transform: "translateX(-2px)" }}
        aria-hidden
      >
        {children}
      </span>
      <span
        className="absolute inset-0 text-[#D4AF37] opacity-40"
        style={{ clipPath: "polygon(0 60%, 100% 60%, 100% 75%, 0 75%)", transform: "translateX(2px)" }}
        aria-hidden
      >
        {children}
      </span>
      <span className="relative">{children}</span>
    </span>
  );
}

function CardSuit({ suit }: { suit: "♠" | "♥" | "♦" | "♣" }) {
  const color = suit === "♥" || suit === "♦" ? "#8b0000" : "#D4AF37";
  return (
    <span className="text-xs font-bold opacity-40" style={{ color }}>
      {suit}
    </span>
  );
}

// ─── CART ────────────────────────────────────────────────────────────────────

function CartDrawer({
  cart,
  onClose,
  onRemove,
  onQtyChange,
}: {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
}) {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="w-full max-w-md bg-[#0a0a0a] border-l border-[#D4AF37]/30 flex flex-col h-full"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#D4AF37]/20">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-[#D4AF37]/60 uppercase">Your Hand</div>
            <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Bebas Neue', cursive" }}>
              THE POT
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎰</div>
              <p className="text-white/40 text-sm tracking-widest uppercase">Your pot is empty</p>
              <p className="text-white/20 text-xs mt-2">Place your bets</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 p-4 border border-[#D4AF37]/15 bg-white/[0.02] rounded"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#D4AF37]/60 uppercase tracking-widest">{item.type}</div>
                  <div className="text-white font-bold text-sm truncate">{item.name}</div>
                  <div className="text-[#D4AF37] font-black">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onQtyChange(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center border border-white/20 text-white/60 hover:text-white hover:border-[#D4AF37]/60 transition-colors rounded"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-white w-5 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => onQtyChange(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center border border-white/20 text-white/60 hover:text-white hover:border-[#D4AF37]/60 transition-colors rounded"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-white/30 hover:text-[#8b0000] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#D4AF37]/20 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm uppercase tracking-widest">Total Pot</span>
              <span className="text-[#D4AF37] font-black text-2xl" style={{ fontFamily: "'Bebas Neue', cursive" }}>
                ${total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => StripeCheckoutUtil.redirectToCheckout(cart)}
              className="w-full py-4 bg-[#D4AF37] text-black font-black text-sm tracking-[0.2em] uppercase hover:bg-[#f0c84a] transition-colors relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap size={16} />
                CASH OUT — STRIPE
              </span>
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
            </button>
            <div className="flex items-center justify-center gap-4 text-white/30 text-xs">
              <span>Apple Pay</span>
              <span>•</span>
              <span>Google Pay</span>
              <span>•</span>
              <span>Card</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

function Nav({ cartCount, onCartOpen }: { cartCount: number; onCartOpen: () => void }) {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-12 py-5"
      style={{
        background: "linear-gradient(to bottom, rgba(10,10,10,0.98), transparent)",
        borderBottom: "1px solid rgba(212,175,55,0)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border border-[#D4AF37] flex items-center justify-center">
          <span className="text-[#D4AF37] text-xs font-black">♠</span>
        </div>
        <div>
          <div className="text-white font-black text-lg tracking-tight leading-none" style={{ fontFamily: "'Bebas Neue', cursive" }}>
            PRODIGI
          </div>
          <div className="text-[#D4AF37]/50 text-[9px] tracking-[0.4em] uppercase leading-none">JdnkSCB</div>
        </div>
      </div>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8">
        {["Beats", "Drumkits", "Merch"].map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            className="text-white/50 hover:text-[#D4AF37] text-xs tracking-[0.25em] uppercase transition-colors duration-200 font-medium"
          >
            {l}
          </a>
        ))}
      </div>

      {/* Cart */}
      <button
        onClick={onCartOpen}
        className="relative flex items-center gap-2 border border-[#D4AF37]/30 px-4 py-2 text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-200 group"
      >
        <ShoppingCart size={16} />
        <span className="text-xs tracking-widest uppercase hidden sm:inline">Pot</span>
        {cartCount > 0 && (
          <motion.div
            key={cartCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-[#8b0000] text-white text-[10px] font-black rounded-full flex items-center justify-center"
          >
            {cartCount}
          </motion.div>
        )}
      </button>
    </motion.nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero({ onShopClick }: { onShopClick: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)" }}
        />
      </div>

      {/* Corner suits */}
      {["♠", "♥", "♦", "♣"].map((suit, i) => (
        <motion.div
          key={suit}
          className="absolute text-4xl md:text-6xl opacity-[0.06]"
          style={{
            top: i < 2 ? "10%" : "auto",
            bottom: i >= 2 ? "10%" : "auto",
            left: i % 2 === 0 ? "5%" : "auto",
            right: i % 2 === 1 ? "5%" : "auto",
          }}
          animate={{ rotate: [0, 5, -5, 0], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          {suit}
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        className="text-center relative z-10 max-w-5xl"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12 } },
        }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="text-[#D4AF37]/60 text-xs tracking-[0.5em] uppercase mb-6"
        >
          ♠ &nbsp; Premium Beats & Production &nbsp; ♠
        </motion.div>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 40, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } }}
          className="text-[clamp(4rem,14vw,11rem)] font-black leading-[0.85] tracking-tight mb-4 text-white"
          style={{ fontFamily: "'Bebas Neue', cursive" }}
        >
          <GlitchText>Joedank-Suncoastbay</GlitchText>
          <br />
          <span className="text-[#D4AF37] relative">
            BETS
            <GoldScribble className="bottom-0 left-0 w-full h-8 -mb-2" />
          </span>
        </motion.h1>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="text-white/40 text-sm md:text-base tracking-widest uppercase max-w-md mx-auto mt-8 mb-12"
        >
          Chart-ready beats. Rare drumkits. Insane drops.
          <br />
          <span className="text-[#8b0000]/80">LEASE BEATS TODAY</span>
        </motion.p>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={onShopClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-4 bg-[#D4AF37] text-black font-black text-sm tracking-[0.25em] uppercase relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Crown size={16} />
              SHOP THE VAULT
            </span>
            <div className="absolute inset-0 bg-black/15 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
          </motion.button>

          <button className="px-10 py-4 border border-[#D4AF37]/30 text-[#D4AF37] font-bold text-sm tracking-[0.25em] uppercase hover:border-[#D4AF37] transition-colors">
            FREE PREVIEW
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[9px] tracking-[0.4em] uppercase">Scroll</span>
        <ChevronDown size={14} />
      </motion.div>
    </section>
  );
}

// ─── BEATS SECTION ───────────────────────────────────────────────────────────

function BeatsSection({ beats, onAddToCart }: { beats: Beat[]; onAddToCart: (item: CartItem) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section id="beats" className="py-32 px-6 md:px-12 relative">
      {/* Section label */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-6 mb-16"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
          <div className="text-center">
            <div className="text-[#D4AF37]/50 text-[9px] tracking-[0.5em] uppercase mb-1">The Vault</div>
            <h2
              className="text-5xl md:text-7xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Bebas Neue', cursive" }}
            >
              BEAT CATALOG
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        </motion.div>

        <div className="space-y-4" ref={containerRef}>
          {beats.map((beat, i) => (
            <motion.div
              key={beat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08 }}
            >
              <BeatPlayer
                beat={beat}
                index={i}
                onAddToCart={() =>
                  onAddToCart({
                    id: `beat-${beat.id}`,
                    name: beat.title,
                    price: beat.price,
                    type: "Beat",
                    quantity: 1,
                  })
                }
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── DRUMKITS SECTION ────────────────────────────────────────────────────────

function DrumkitsSection({ onAddToCart }: { onAddToCart: (item: CartItem) => void }) {
  return (
    <section id="drumkits" className="py-32 px-6 md:px-12 relative">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-[#D4AF37]/50 text-[9px] tracking-[0.5em] uppercase mb-2">Digital Downloads</div>
          <h2
            className="text-5xl md:text-7xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Bebas Neue', cursive" }}
          >
            DRUMKITS
          </h2>
          <div className="w-24 h-0.5 bg-[#8b0000] mt-3" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DRUMKITS.map((kit, i) => (
            <motion.div
              key={kit.id}
              initial={{ opacity: 0, rotateY: -15, y: 30 }}
              whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative border border-[#D4AF37]/20 bg-gradient-to-b from-white/[0.03] to-transparent p-6 group cursor-pointer"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.05) 0%, transparent 60%)
                `,
              }}
            >
              {/* Corner suits */}
              <div className="absolute top-3 left-3"><CardSuit suit="♠" /></div>
              <div className="absolute top-3 right-3"><CardSuit suit="♠" /></div>
              <div className="absolute bottom-3 left-3 rotate-180"><CardSuit suit="♠" /></div>
              <div className="absolute bottom-3 right-3 rotate-180"><CardSuit suit="♠" /></div>

              {kit.badge && (
                <div className="absolute -top-3 left-6 bg-[#8b0000] text-white text-[9px] font-black tracking-widest px-3 py-1 uppercase">
                  {kit.badge}
                </div>
              )}

              <div className="text-5xl mb-4 text-center">{kit.image}</div>
              <div className="text-[#D4AF37]/50 text-[9px] tracking-[0.3em] uppercase mb-1">{kit.files}</div>
              <h3
                className="text-2xl font-black text-white tracking-tight mb-1 group-hover:text-[#D4AF37] transition-colors"
                style={{ fontFamily: "'Bebas Neue', cursive" }}
              >
                {kit.title}
              </h3>
              <p className="text-white/40 text-xs mb-4">{kit.subtitle}</p>

              <div className="flex flex-wrap gap-1 mb-6">
                {kit.tags.map((t) => (
                  <span key={t} className="text-[9px] px-2 py-1 border border-[#D4AF37]/20 text-[#D4AF37]/60 uppercase tracking-widest">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#D4AF37] font-black text-2xl" style={{ fontFamily: "'Bebas Neue', cursive" }}>
                  ${kit.price}
                </span>
                <button
                  onClick={() =>
                    onAddToCart({ id: kit.id, name: kit.title, price: kit.price, type: "Drumkit", quantity: 1 })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs tracking-widest uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-200 font-bold"
                >
                  <Package size={12} />
                  Add to Pot
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── MERCH SECTION ───────────────────────────────────────────────────────────

function MerchSection({ onAddToCart }: { onAddToCart: (item: CartItem) => void }) {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  return (
    <section id="merch" className="py-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-[#D4AF37]/50 text-[9px] tracking-[0.5em] uppercase mb-2">Physical Goods</div>
          <h2
            className="text-5xl md:text-7xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Bebas Neue', cursive" }}
          >
            MERCH DROP
          </h2>
          <div className="w-24 h-0.5 bg-[#D4AF37] mt-3" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MERCH.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative group"
            >
              {/* Lottery-ticket style card */}
              <div
                className="border border-[#D4AF37]/25 relative overflow-hidden"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 19px,
                      rgba(212,175,55,0.03) 19px,
                      rgba(212,175,55,0.03) 20px
                    )
                  `,
                }}
              >
                {/* Ticket top */}
                <div className="bg-[#D4AF37]/5 border-b border-[#D4AF37]/15 border-dashed p-6 text-center">
                  <div className="text-6xl mb-2">{item.image}</div>
                  {item.badge && (
                    <span className="text-[9px] bg-[#8b0000] text-white px-2 py-0.5 tracking-widest uppercase font-black">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Ticket perforations */}
                <div className="flex">
                  <div className="w-3 h-3 rounded-full bg-[#0a0a0a] -ml-1.5 -mt-1.5 absolute left-0" style={{ top: "calc(33.33% - 6px)" }} />
                  <div className="w-3 h-3 rounded-full bg-[#0a0a0a] -mr-1.5 -mt-1.5 absolute right-0" style={{ top: "calc(33.33% - 6px)" }} />
                </div>

                <div className="p-6">
                  <h3
                    className="text-xl font-black text-white tracking-tight mb-1 group-hover:text-[#D4AF37] transition-colors"
                    style={{ fontFamily: "'Bebas Neue', cursive" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-white/40 text-xs mb-4">{item.subtitle}</p>

                  {/* Size selector */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {item.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSizes((prev) => ({ ...prev, [item.id]: s }))}
                        className={`w-9 h-9 text-xs font-bold border transition-all duration-150 ${
                          selectedSizes[item.id] === s
                            ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                            : "border-white/20 text-white/50 hover:border-[#D4AF37]/60 hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className="text-[#D4AF37] font-black text-2xl"
                      style={{ fontFamily: "'Bebas Neue', cursive" }}
                    >
                      ${item.price}
                    </span>
                    <button
                      onClick={() =>
                        onAddToCart({
                          id: `${item.id}-${selectedSizes[item.id] || item.sizes[0]}`,
                          name: `${item.title} — ${selectedSizes[item.id] || item.sizes[0]}`,
                          price: item.price,
                          type: "Merch",
                          quantity: 1,
                        })
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs tracking-widest uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-200 font-bold"
                    >
                      <Shirt size={12} />
                      Add to Pot
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#D4AF37]/15 py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <div
              className="text-4xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Bebas Neue', cursive" }}
            >
              PRODIGI
            </div>
            <div className="text-[#D4AF37]/40 text-xs tracking-[0.4em] uppercase mt-1">
              © {new Date().getFullYear()} — JdnkSCB
            </div>
          </div>
          <div className="flex items-center gap-3">
            {["♠", "♥", "♦", "♣"].map((s) => (
              <span key={s} className="text-2xl opacity-20" style={{ color: s === "♥" || s === "♦" ? "#8b0000" : "#D4AF37" }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5">
          <div className="flex gap-6">
            {["Terms", "Privacy", "Licensing", "Contact"].map((l) => (
              <a key={l} href="#" className="text-white/25 text-xs tracking-widest uppercase hover:text-[#D4AF37]/60 transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="text-white/20 text-xs">
            Payments secured by Stripe · Licensed beats · All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function Page() {
  const [beats, setBeats] = useState<Beat[]>(DEMO_BEATS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const beatsRef = useRef<HTMLElement | null>(null);

  // Try to load real beats; fall back to demo data
  useEffect(() => {
    loadBeatsFromManifest()
      .then((b) => { if (b.length > 0) setBeats(b); })
      .catch(() => {});
  }, []);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const scrollToBeats = () => {
    document.getElementById("beats")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Google Font import via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0a; color: white; font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #D4AF37; }
        input[type=range] { -webkit-appearance: none; height: 2px; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #D4AF37; cursor: pointer; }
        input[type=range]::-webkit-slider-runnable-track { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <GrainOverlay />
      <Nav cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

      <main className="min-h-screen bg-[#0a0a0a]">
        <Hero onShopClick={scrollToBeats} />
        <BeatsSection beats={beats} onAddToCart={addToCart} />
        <DrumkitsSection onAddToCart={addToCart} />
        <MerchSection onAddToCart={addToCart} />
        <Footer />
      </main>

      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            cart={cart}
            onClose={() => setCartOpen(false)}
            onRemove={removeFromCart}
            onQtyChange={updateQty}
          />
        )}
      </AnimatePresence>
    </>
  );
}
