import { $ } from 'bun';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const buildDir = fileURLToPath(new URL('../build/client/', import.meta.url));
const src = path.join(buildDir, 'favicon.png');

// Regular icons: just resize
const regular = [
	{ out: 'icon-192.png', size: 192 },
	{ out: 'icon-512.png', size: 512 },
	{ out: 'apple-touch-icon.png', size: 180 }
];

// Maskable icons: logo centered in safe zone (80% of total), white background
const maskable = [
	{ out: 'icon-maskable-192.png', total: 192, inner: 154 },
	{ out: 'icon-maskable-512.png', total: 512, inner: 410 }
];

for (const { out, size } of regular) {
	const dest = path.join(buildDir, out);
	await $`nix shell nixpkgs#imagemagick -c convert ${src} -resize ${size}x${size} ${dest}`;
	console.log(`Generated ${out} (${size}x${size})`);
}

for (const { out, total, inner } of maskable) {
	const dest = path.join(buildDir, out);
	await $`nix shell nixpkgs#imagemagick -c convert ${src} -resize ${inner}x${inner} -background white -gravity center -extent ${total}x${total} ${dest}`;
	console.log(`Generated ${out} (${total}x${total}, inner ${inner}x${inner})`);
}
