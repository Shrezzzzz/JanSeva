const fs = require('fs');
const path = require('path');

// Generate minimal PNG files using raw PNG binary format
// PNG signature + IHDR + IDAT (solid color) + IEND

function createMinimalPNG(size, r, g, b) {
  const { deflateSync } = require('zlib');

  // Build raw image data: each row = filter byte (0) + RGBA pixels
  const rowBytes = 1 + size * 4;
  const rawData  = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    const rowOff = y * rowBytes;
    rawData[rowOff] = 0; // filter type None
    for (let x = 0; x < size; x++) {
      const off = rowOff + 1 + x * 4;
      rawData[off]     = r;
      rawData[off + 1] = g;
      rawData[off + 2] = b;
      rawData[off + 3] = 255;
    }
  }

  const compressed = deflateSync(rawData);

  function chunk(type, data) {
    const len  = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf  = Buffer.alloc(4);
    // Simple CRC32
    const crcData = Buffer.concat([typeBuf, data]);
    crcBuf.writeInt32BE(crc32(crcData));
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
      }
    }
    return (crc ^ 0xFFFFFFFF) | 0;
  }

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 2;  // color type RGB (we embed alpha via RGBA — use 6 for RGBA)
  // Actually use RGBA: color type 6
  ihdr[9]  = 6;
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const idat = compressed;
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend),
  ]);
}

// Green: #1A6B3C = rgb(26, 107, 60)
const sizes = [192, 512];
const dir   = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(dir, { recursive: true });

for (const size of sizes) {
  const png = createMinimalPNG(size, 26, 107, 60);
  const out = path.join(dir, `icon-${size}.png`);
  fs.writeFileSync(out, png);
  console.log(`Created ${out} (${png.length} bytes)`);
}

// Also create og-image (1200x630, same green)
const ogPng = createMinimalPNG(1200, 26, 107, 60);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'og-image.png'), ogPng);
console.log('Created public/og-image.png');
