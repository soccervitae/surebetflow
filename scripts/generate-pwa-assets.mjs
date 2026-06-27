/**
 * Generates PWA icons and iOS splash screens.
 * Run: node scripts/generate-pwa-assets.mjs
 *
 * To use a custom icon, place the PNG at public/icons/icon-src.png before running.
 * Otherwise it falls back to public/icons/icon-512x512.png.
 */

import sharp from "sharp"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const iconsDir = path.join(root, "public", "icons")
const splashDir = path.join(root, "public", "splash")

fs.mkdirSync(iconsDir, { recursive: true })
fs.mkdirSync(splashDir, { recursive: true })

// --- Source files ---
const srcIcon = fs.existsSync(path.join(iconsDir, "icon-src.png"))
  ? path.join(iconsDir, "icon-src.png")
  : path.join(iconsDir, "icon-512x512.png")

const srcLogo = path.join(iconsDir, "logo-email-light.png")

const NAVY = { r: 10, g: 15, b: 30, alpha: 1 } // #0a0f1e

// ── Icons ──────────────────────────────────────────────────────────────────
const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]

// Load source icon into buffer to avoid same-file conflicts
const srcIconBuf = await sharp(srcIcon).png().toBuffer()

console.log("Generating icons from:", srcIcon)
for (const size of iconSizes) {
  await sharp(srcIconBuf)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))
  console.log(`  ✓ icon-${size}x${size}.png`)
}

// Maskable icons (15% safe-zone padding = icon takes 70% of area)
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.7)
  const padded = await sharp(srcIconBuf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 30, g: 58, b: 138, alpha: 1 } } })
    .composite([{ input: padded, gravity: "center" }])
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}-maskable.png`))
  console.log(`  ✓ icon-${size}x${size}-maskable.png`)
}

// Apple touch icon (180×180) — copy buffer to avoid same-file error
const appleIconBuf = await sharp(path.join(iconsDir, "icon-180x180.png")).png().toBuffer()
await sharp(appleIconBuf).toFile(path.join(iconsDir, "apple-touch-icon.png"))
console.log("  ✓ apple-touch-icon.png")

// Favicon
await sharp(srcIcon).resize(32, 32).png().toFile(path.join(iconsDir, "favicon-32x32.png"))
console.log("  ✓ favicon-32x32.png")

// ── Splash screens ──────────────────────────────────────────────────────────
// Logo takes up ~55% of the shorter dimension, centered
const splashSizes = [
  { w: 640,  h: 1136, name: "splash-640x1136" },   // iPhone SE 1st gen
  { w: 750,  h: 1334, name: "splash-750x1334" },   // iPhone 8/7/6
  { w: 1080, h: 1920, name: "splash-1080x1920" },  // Android HD
  { w: 1125, h: 2436, name: "splash-1125x2436" },  // iPhone X/XS/11 Pro
  { w: 1170, h: 2532, name: "splash-1170x2532" },  // iPhone 12/13/14
  { w: 1179, h: 2556, name: "splash-1179x2556" },  // iPhone 14 Pro
  { w: 1242, h: 2208, name: "splash-1242x2208" },  // iPhone 8+
  { w: 1242, h: 2688, name: "splash-1242x2688" },  // iPhone XS Max
  { w: 1284, h: 2778, name: "splash-1284x2778" },  // iPhone 12/13/14 Pro Max
  { w: 1290, h: 2796, name: "splash-1290x2796" },  // iPhone 14 Pro Max
  { w: 828,  h: 1792, name: "splash-828x1792" },   // iPhone XR/11
  { w: 1536, h: 2048, name: "splash-1536x2048" },  // iPad (retina)
  { w: 1668, h: 2388, name: "splash-1668x2388" },  // iPad Pro 11"
  { w: 2048, h: 2732, name: "splash-2048x2732" },  // iPad Pro 12.9"
]

const logoMeta = await sharp(srcLogo).metadata()
const logoW = logoMeta.width
const logoH = logoMeta.height

console.log("\nGenerating splash screens…")
for (const { w, h, name } of splashSizes) {
  // Logo width = 55% of screen width, keep aspect ratio
  const targetW = Math.round(w * 0.55)
  const targetH = Math.round((targetW / logoW) * logoH)

  const logoResized = await sharp(srcLogo)
    .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 10, g: 15, b: 30, alpha: 1 } },
  })
    .composite([{ input: logoResized, gravity: "center" }])
    .png()
    .toFile(path.join(splashDir, `${name}.png`))

  console.log(`  ✓ ${name}.png`)
}

console.log("\nAll assets generated.")
