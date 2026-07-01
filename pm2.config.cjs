const packageJson = require('./package.json');
module.exports = {
	name: packageJson.name,
	script: 'bun',
	args: 'index.js',
	cwd: '/var/www/rizinos.com',
	env: { NODE_ENV: 'production', PORT: '3001' }
};
