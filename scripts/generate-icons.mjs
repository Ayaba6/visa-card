// Génère les icônes PNG de la PWA à partir des logos SVG.
// Usage : npm run icons (à relancer après toute modification de public/logo*.svg)
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../public/', import.meta.url);
const logo = await readFile(new URL('logo.svg', root));
const maskable = await readFile(new URL('logo-maskable.svg', root));

const outputs = [
  { src: logo, size: 192, file: 'icons/icon-192.png' },
  { src: logo, size: 512, file: 'icons/icon-512.png' },
  { src: maskable, size: 192, file: 'icons/maskable-192.png' },
  { src: maskable, size: 512, file: 'icons/maskable-512.png' },
  // iOS arrondit lui-même les coins : on lui donne un fond plein
  { src: maskable, size: 180, file: 'apple-touch-icon.png' },
  { src: logo, size: 32, file: 'icons/favicon-32.png' },
];

for (const { src, size, file } of outputs) {
  await sharp(src, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toFile(new URL(file, root).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  console.log(`✓ ${file} (${size}×${size})`);
}
