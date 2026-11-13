// Entrypoint delegating to TypeScript server.ts
try {
  require('tsx/cjs');
  const serverModule = require('./server.ts');
  module.exports = serverModule.default || serverModule;
} catch (e) {
  console.log('[Server Entrypoint] Starting via tsx server.ts');
  require('child_process').spawn('npx', ['tsx', require('path').join(__dirname, 'server.ts')], { stdio: 'inherit' });
}
