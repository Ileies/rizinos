import { copyFile } from 'node:fs/promises';
import path from 'path';
import { $ } from 'bun';

const rootDir = path.resolve(import.meta.dir, '..');
const name = (await import(path.join(rootDir, 'package.json'))).name;
const server = `root@${process.env.PUBLIC_ORIGIN}`;
const remotePath = `/var/www/${process.env.PUBLIC_ORIGIN}`;

console.log('Copying configuration files to build directory...');
await copyFile(path.join(rootDir, 'pm2.config.cjs'), path.join(rootDir, 'build/pm2.config.cjs'));
await copyFile(path.join(rootDir, '.env'), path.join(rootDir, 'build/.env'));
await copyFile(path.join(rootDir, 'package.json'), path.join(rootDir, 'build/package.json'));

console.log('Deleting old files on the server...');
await $`ssh ${server} "rm -rf ${remotePath}/{*,.*}"`;

console.log('Uploading new files to the server...');
await $`rsync -avz ${path.join(rootDir, 'build')}/ ${server}:${remotePath}`;

console.log('Restarting the application with PM2...');
await $`ssh -t ${server} "cd ${remotePath}; bun i; pm2 delete ${name}; pm2 start pm2.config.cjs; pm2 save"`;

console.log('Deployment complete!');
