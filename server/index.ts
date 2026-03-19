/**
 * kokoro — Standalone Signaling Server
 * Next.js 依存を除去した独立サーバー
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const port = parseInt(process.env.PORT || '3001', 10);

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('kokoro signaling server running');
});

const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// In-memory rooms
interface Room {
  id: string;
  participants: Map<string, { socketId: string; displayName: string }>;
  passphrase: string[];
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log(`[Signaling] Connected: ${socket.id}`);

  // --- Room Join (by passphrase) ---
  socket.on('room:join', (data: { passphrase: string[]; displayName: string }, ack) => {
    const key = data.passphrase.join('-');
    let room = rooms.get(key);

    if (!room) {
      // Create new room
      room = {
        id: key,
        participants: new Map(),
        passphrase: data.passphrase,
      };
      rooms.set(key, room);
    }

    room.participants.set(socket.id, {
      socketId: socket.id,
      displayName: data.displayName,
    });

    socket.join(key);

    // Notify existing participants
    socket.to(key).emit('participant:joined', {
      id: socket.id,
      displayName: data.displayName,
    });

    // Return current participants list
    const participants = Array.from(room.participants.entries()).map(([id, p]) => ({
      id,
      displayName: p.displayName,
    }));

    ack({ success: true, roomId: key, participants });
  });

  // --- WebRTC Signaling Relay ---
  socket.on('webrtc:offer', (data: { targetId: string; sdp: any }) => {
    io.to(data.targetId).emit('webrtc:offer', { fromId: socket.id, sdp: data.sdp });
  });

  socket.on('webrtc:answer', (data: { targetId: string; sdp: any }) => {
    io.to(data.targetId).emit('webrtc:answer', { fromId: socket.id, sdp: data.sdp });
  });

  socket.on('webrtc:ice-candidate', (data: { targetId: string; candidate: any }) => {
    io.to(data.targetId).emit('webrtc:ice-candidate', { fromId: socket.id, candidate: data.candidate });
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    for (const [key, room] of rooms) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        io.to(key).emit('participant:left', { id: socket.id });

        if (room.participants.size === 0) {
          rooms.delete(key);
        }
        break;
      }
    }
    console.log(`[Signaling] Disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`\n🏠 kokoro signaling server`);
  console.log(`   ws://localhost:${port}`);
});
