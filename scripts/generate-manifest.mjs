#!/usr/bin/env node
/**
 * generate-manifest.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this script after adding new beats to public/beats/ to regenerate
 * the manifest.json file that the site reads at runtime.
 *
 * Usage:
 *   node scripts/generate-manifest.mjs
 *
 * Or add to package.json:
 *   "scripts": {
 *     "beats:manifest": "node scripts/generate-manifest.mjs"
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BEATS_DIR = path.join(__dirname, "..", "public", "beats");
const MANIFEST_PATH = path.join(BEATS_DIR, "manifest.json");

/** Convert a folder slug to a display title */
function slugToTitle(slug) {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function main() {
  if (!fs.existsSync(BEATS_DIR)) {
    fs.mkdirSync(BEATS_DIR, { recursive: true });
    console.log(`✅ Created ${BEATS_DIR}`);
  }

  const folders = fs
    .readdirSync(BEATS_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        // Must contain at least audio.mp3 or info.txt
        (fs.existsSync(path.join(BEATS_DIR, d.name, "audio.mp3")) ||
          fs.existsSync(path.join(BEATS_DIR, d.name, "info.txt")))
    )
    .map((d) => d.name)
    .sort();

  const manifest = folders.map((folder) => ({
    folder,
    title: slugToTitle(folder),
  }));

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`\n🎰  Beat manifest generated — ${manifest.length} beat(s)\n`);
  manifest.forEach((b, i) => {
    const hasAudio = fs.existsSync(path.join(BEATS_DIR, b.folder, "audio.mp3"));
    const hasInfo = fs.existsSync(path.join(BEATS_DIR, b.folder, "info.txt"));
    const status = [hasAudio ? "🎵 audio" : "⚠️  NO audio", hasInfo ? "📄 info" : "⚠️  NO info"].join("  ");
    console.log(`  ${String(i + 1).padStart(2, "0")}. ${b.title.padEnd(24)} ${status}`);
  });

  if (manifest.length === 0) {
    console.log("  (no beat folders found — create subfolders inside public/beats/)\n");
  } else {
    console.log(`\n  Manifest saved to: ${MANIFEST_PATH}\n`);
  }
}

main();
