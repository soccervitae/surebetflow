import sharp from "sharp"
import { writeFileSync } from "fs"

// Square SVG icon with SurebetFlow brand
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1a2e"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="arrow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a0f0c0"/>
      <stop offset="100%" stop-color="#7de8e8"/>
    </linearGradient>
  </defs>
  <!-- Background rounded square -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- S letter bold -->
  <text x="256" y="340" font-family="Arial Black, sans-serif" font-size="300" font-weight="900"
        text-anchor="middle" fill="url(#arrow)">S</text>
  <!-- Small flow line indicator -->
  <rect x="160" y="390" width="192" height="8" rx="4" fill="url(#arrow)" opacity="0.6"/>
</svg>`

// Maskable version (safe zone: inner 80% of the icon)
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1a2e"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="arrow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a0f0c0"/>
      <stop offset="100%" stop-color="#7de8e8"/>
    </linearGradient>
  </defs>
  <!-- Full bleed background -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <!-- S letter - slightly smaller for maskable safe zone -->
  <text x="256" y="320" font-family="Arial Black, sans-serif" font-size="260" font-weight="900"
        text-anchor="middle" fill="url(#arrow)">S</text>
  <rect x="175" y="370" width="162" height="7" rx="3.5" fill="url(#arrow)" opacity="0.6"/>
</svg>`

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function generate() {
  const iconBuf = Buffer.from(svgIcon)
  const maskBuf = Buffer.from(svgMaskable)

  for (const size of sizes) {
    await sharp(iconBuf)
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}x${size}.png`)
    console.log(`Generated icon-${size}x${size}.png`)
  }

  // Apple touch icon (180x180)
  await sharp(iconBuf).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png")
  console.log("Generated apple-touch-icon.png")

  // Maskable icons
  await sharp(maskBuf).resize(192, 192).png().toFile("public/icons/icon-192x192-maskable.png")
  await sharp(maskBuf).resize(512, 512).png().toFile("public/icons/icon-512x512-maskable.png")
  console.log("Generated maskable icons")

  // Favicon 32x32
  await sharp(iconBuf).resize(32, 32).png().toFile("public/icons/favicon-32x32.png")
  console.log("Done!")
}

generate().catch(console.error)
