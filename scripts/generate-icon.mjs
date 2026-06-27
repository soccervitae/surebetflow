/**
 * Generates the SurebetFlow app icon: blue rounded square + white X + green dot.
 * Run: node scripts/generate-icon.mjs
 */

import sharp from "sharp"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const iconsDir = path.join(root, "public", "icons")
const splashDir = path.join(root, "public", "splash")

// ── SVG icon at 512×512 ──────────────────────────────────────────────────────
// Blue bg + white X (two thick rounded bars, 45°) + green dot center
function buildSVG(size) {
  const s = size
  const cx = s / 2
  const cy = s / 2

  // X bar dimensions proportional to icon size
  const barW = s * 0.135   // thickness of each bar
  const barL = s * 0.62    // length of each bar (center to tip, half = barL/2)
  const r    = barW / 2    // rounded end radius

  // Dot
  const dotR = s * 0.072

  // Background corner radius (iOS style ~22.5%)
  const bgR  = s * 0.225

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${bgR}" ry="${bgR}" fill="#2347b5"/>

  <!-- X: two bars rotated ±45° -->
  <g transform="translate(${cx},${cy})">
    <!-- bar 1: top-left to bottom-right -->
    <rect
      x="${-barL/2}" y="${-barW/2}"
      width="${barL}" height="${barW}"
      rx="${r}" ry="${r}"
      fill="white"
      transform="rotate(45)"
    />
    <!-- bar 2: top-right to bottom-left -->
    <rect
      x="${-barL/2}" y="${-barW/2}"
      width="${barL}" height="${barW}"
      rx="${r}" ry="${r}"
      fill="white"
      transform="rotate(-45)"
    />
    <!-- Green dot center -->
    <circle cx="0" cy="0" r="${dotR}" fill="#22c55e"/>
  </g>
</svg>`
}

// Generate 512×512 source PNG
const svg512 = buildSVG(512)
const srcBuf = await sharp(Buffer.from(svg512)).png().toBuffer()

// Save as icon-src so generate-pwa-assets uses it next time
import fs from "fs"
fs.writeFileSync(path.join(iconsDir, "icon-src.png"), srcBuf)
console.log("✓ icon-src.png")

// All icon sizes
const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]
for (const size of iconSizes) {
  const buf = await sharp(Buffer.from(buildSVG(size))).png().toBuffer()
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buf)
  console.log(`✓ icon-${size}x${size}.png`)
}

// Maskable: icon centred on blue bg with 15% safe-zone padding
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.7)
  const innerBuf = await sharp(Buffer.from(buildSVG(inner)))
    .resize(inner, inner)
    .png()
    .toBuffer()
  const maskBuf = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 35, g: 71, b: 181, alpha: 1 } },
  })
    .composite([{ input: innerBuf, gravity: "center" }])
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}-maskable.png`), maskBuf)
  console.log(`✓ icon-${size}x${size}-maskable.png`)
}

// Apple touch icon (180×180)
fs.copyFileSync(path.join(iconsDir, "icon-180x180.png"), path.join(iconsDir, "apple-touch-icon.png"))
console.log("✓ apple-touch-icon.png")

// Favicon 32×32
const fav = await sharp(Buffer.from(buildSVG(32))).png().toBuffer()
fs.writeFileSync(path.join(iconsDir, "favicon-32x32.png"), fav)
console.log("✓ favicon-32x32.png")

// ── Splash screens ──────────────────────────────────────────────────────────
const logoSrcBuf = fs.readFileSync(path.join(iconsDir, "logo-email-light.png"))
const logoMeta = await sharp(logoSrcBuf).metadata()
const logoW = logoMeta.width
const logoH = logoMeta.height

const splashSizes = [
  { w: 640,  h: 1136 }, { w: 750,  h: 1334 }, { w: 1080, h: 1920 },
  { w: 1125, h: 2436 }, { w: 1170, h: 2532 }, { w: 1179, h: 2556 },
  { w: 1242, h: 2208 }, { w: 1242, h: 2688 }, { w: 1284, h: 2778 },
  { w: 1290, h: 2796 }, { w: 828,  h: 1792 }, { w: 1536, h: 2048 },
  { w: 1668, h: 2388 }, { w: 2048, h: 2732 },
]

console.log("\nGenerating splash screens…")
for (const { w, h } of splashSizes) {
  const targetW = Math.round(w * 0.55)
  const targetH = Math.round((targetW / logoW) * logoH)
  const logoResized = await sharp(logoSrcBuf)
    .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer()
  const splashBuf = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 10, g: 15, b: 30, alpha: 1 } },
  })
    .composite([{ input: logoResized, gravity: "center" }])
    .png().toBuffer()
  fs.writeFileSync(path.join(splashDir, `splash-${w}x${h}.png`), splashBuf)
  console.log(`  ✓ splash-${w}x${h}.png`)
}

console.log("\nAll done.")
