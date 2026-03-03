/**
 * Generates pwa-192x192.png and pwa-512x512.png inside /public
 * using only Node.js built-in modules (no external packages needed).
 *
 * Icon design: purple rounded-rect background (#7c3aed) + white phone shape.
 */

import { writeFileSync } from "fs";
import { deflateSync, crc32 } from "zlib";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

// ── PNG helpers ───────────────────────────────────────────────────────────────

function u32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = u32BE(data.length);
  const combined = Buffer.concat([typeBytes, data]);
  const crcVal = crc32(combined);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(crcVal | 0, 0); // treat as signed to handle >0x7fffffff
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function ihdr(w, h) {
  const d = Buffer.alloc(13);
  d.writeUInt32BE(w, 0);
  d.writeUInt32BE(h, 4);
  d[8] = 8;  // bit depth
  d[9] = 6;  // color type: RGBA
  d[10] = 0; // deflate
  d[11] = 0; // adaptive filter
  d[12] = 0; // no interlace
  return d;
}

function encodePNG(width, height, pixels /* Uint8ClampedArray RGBA */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Build raw scanlines: 1 filter byte + row pixels
  const rowLen = width * 4;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[(rowLen + 1) * y] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = (rowLen + 1) * y + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr(width, height)),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Pixel drawing helpers ─────────────────────────────────────────────────────

function makeCanvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4); // RGBA, default transparent
  return {
    w,
    h,
    data,
    setPixel(x, y, r, g, b, a = 255) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    },
    fillRect(x0, y0, x1, y1, r, g, b, a = 255) {
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
          this.setPixel(x, y, r, g, b, a);
    },
    fillCircle(cx, cy, radius, r, g, b, a = 255) {
      const r2 = radius * radius;
      for (let y = cy - radius; y <= cy + radius; y++)
        for (let x = cx - radius; x <= cx + radius; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r2)
            this.setPixel(x, y, r, g, b, a);
    },
    fillRoundedRect(x0, y0, x1, y1, rx, r, g, b, a = 255) {
      const ry = rx;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          // Corner checks
          if (x < x0 + rx && y < y0 + ry) {
            if ((x - (x0 + rx)) ** 2 + (y - (y0 + ry)) ** 2 > rx * ry) continue;
          } else if (x > x1 - rx && y < y0 + ry) {
            if ((x - (x1 - rx)) ** 2 + (y - (y0 + ry)) ** 2 > rx * ry) continue;
          } else if (x < x0 + rx && y > y1 - ry) {
            if ((x - (x0 + rx)) ** 2 + (y - (y1 - ry)) ** 2 > rx * ry) continue;
          } else if (x > x1 - rx && y > y1 - ry) {
            if ((x - (x1 - rx)) ** 2 + (y - (y1 - ry)) ** 2 > rx * ry) continue;
          }
          this.setPixel(x, y, r, g, b, a);
        }
      }
    },
  };
}

// ── Icon renderer ─────────────────────────────────────────────────────────────
// Draws a purple rounded-rect background + simplified white phone handset

function drawIcon(size) {
  const c = makeCanvas(size, size);
  const s = size / 192; // scale factor

  // Background: purple rounded rect
  const bg = Math.round(40 * s);         // corner radius  
  c.fillRoundedRect(0, 0, size - 1, size - 1, bg, 0x7c, 0x3a, 0xed);

  // Phone handset as two overlapping rounded rects (diagonal orientation)
  // Scaled from 192×192 coordinate space

  const sc = (n) => Math.round(n * s);

  // Draw simplified phone icon (two ear pieces + body)
  // Top-left block (earpiece)
  c.fillRoundedRect(sc(52), sc(40), sc(90), sc(75), sc(10), 255, 255, 255);
  // Bottom-right block (mouthpiece)
  c.fillRoundedRect(sc(102), sc(117), sc(140), sc(152), sc(10), 255, 255, 255);
  // Diagonal body connecting them
  const bodyW = sc(20);
  for (let t = 0; t <= 100; t++) {
    const frac = t / 100;
    const cx = Math.round(sc(71 + 52 * frac));
    const cy = Math.round(sc(58 + 77 * frac));
    c.fillRect(cx - bodyW / 2, cy - bodyW / 2, cx + bodyW / 2, cy + bodyW / 2, 255, 255, 255);
  }

  return c.data;
}

// ── Generate and save ─────────────────────────────────────────────────────────

for (const size of [192, 512]) {
  const pixels = drawIcon(size);
  const buf = encodePNG(size, size, pixels);
  const outPath = join(PUBLIC, `pwa-${size}x${size}.png`);
  writeFileSync(outPath, buf);
  console.log(`✓ Generated ${outPath} (${buf.length} bytes)`);
}

console.log("Done — PNG icons written to /public");
