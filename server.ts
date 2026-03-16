/**
 * kokoro — Custom Next.js Server with Socket.IO
 * next dev ではなく、このファイルでサーバーを起動することで
 * Socket.IOシグナリングサーバーを同一プロセスで稼働させる
 * 
 * 使い方: npx ts-node --esm server.ts
 * もしくは: node --loader ts-node/esm server.ts
 */

import { createServer } from 'http';
import next from 'next';
import { SignalingServer } from './src/engine/network/server/SignalingServer';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Socket.IOシグナリングサーバーを起動
  const signalingServer = new SignalingServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`\n🫧 kokoro server ready`);
    console.log(`   Frontend: http://${hostname}:${port}`);
    console.log(`   Socket.IO: ws://${hostname}:${port}`);
    console.log(`   Mode: ${dev ? 'development' : 'production'}\n`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down...');
    signalingServer.shutdown();
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
