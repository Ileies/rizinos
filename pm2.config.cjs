const { join } = require('path');
const packageJson = require('./package.json');
module.exports = {
	name: packageJson.name,
	script: 'bun',
	args: 'run ' + join(__dirname, 'server.js'),
	interpreter: 'none',
	env: { NODE_ENV: 'production', PORT: '3001' }
};
