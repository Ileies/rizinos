import { copyFile } from 'node:fs/promises';
import path from 'path';
import { $ } from 'bun';

const rootDir = path.resolve(import.meta.dir, '..');
const remotePath = `/var/www/rizinos.com`;

console.log('Copying configuration files to build directory...');
await copyFile(path.join(rootDir, '.env'), path.join(rootDir, 'build/.env'));
await copyFile(path.join(rootDir, 'package.json'), path.join(rootDir, 'build/package.json'));

console.log('Deleting old files on the server...');
await $`ssh ros "rm -rf ${remotePath}/{*,.*}"`;

console.log('Uploading new files to the server...');
await $`rsync -avz ${path.join(rootDir, 'build')}/ ros:${remotePath}`;

console.log('Installing dependencies and restarting rizinos.service...');
await $`ssh ros "cd ${remotePath} && bun i && systemctl restart rizinos.service && systemctl is-active --quiet rizinos.service"`;

console.log('Deployment complete!');
