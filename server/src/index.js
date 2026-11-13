// Entrypoint delegating to TypeScript server.ts
try {
  require('tsx/cjs');
  const serverModule = require('./server.ts');
  const app = serverModule.default || serverModule;
  if (serverModule.startServer && require.main === module) {
    serverModule.startServer();
  }
  module.exports = app;
} catch (e) {
  console.log('[Server Entrypoint] Starting via tsx server.ts', e);
}
