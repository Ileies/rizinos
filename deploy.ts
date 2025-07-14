import { copyFile } from 'node:fs/promises';
import path from 'path';
import { $ } from 'bun';

const name = (await import('./package.json')).name;
const server = `root@${process.env.PUBLIC_ORIGIN}`;
const remotePath = `/var/www/${process.env.PUBLIC_ORIGIN}`;

console.log('Copying configuration files to build directory...');
await copyFile(path.resolve('./pm2.config.cjs'), path.resolve('./build/pm2.config.cjs'));
await copyFile(path.resolve('./.env'), path.resolve('./build/.env'));
await copyFile(path.resolve('./package.json'), path.resolve('./build/package.json'));

console.log('Deleting old files on the server...');
await $`ssh ${server} "rm -rf ${remotePath}/{*,.*}"`;

console.log('Uploading new files to the server...');
await $`rsync -avz ./build/ ${server}:${remotePath}`;

console.log('Restarting the application with PM2...');
await $`ssh ${server} "cd ${remotePath}; bun i; pm2 delete ${name}; pm2 start pm2.config.cjs; pm2 save"`;

console.log('Deployment complete!');
