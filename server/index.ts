/**
 * kokoro — Standalone Signaling Server (Production-Ready)
 * Deployable to Render / Railway / Fly.io
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const port = parseInt(process.env.PORT || '3001', 10);
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

const httpServer = createServer((req, res) => {
  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'kokoro-signaling',
      rooms: rooms.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// In-memory rooms
interface Room {
  id: string;
  participants: Map<string, { socketId: string; displayName: string }>;
  passphrase: string[];
  createdAt: number;
}

const rooms = new Map<string, Room>();

// Room cleanup: remove stale rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, room] of rooms) {
    if (room.participants.size === 0 && now - room.createdAt > 300000) {
      rooms.delete(key);
    }
  }
}, 300000);

io.on('connection', (socket) => {
  console.log(`[Signaling] Connected: ${socket.id} (total: ${io.engine.clientsCount})`);

  // --- Room Join (by passphrase) ---
  socket.on('room:join', (data: { passphrase: string[]; displayName: string }, ack) => {
    const key = data.passphrase.join('-');
    let room = rooms.get(key);

    if (!room) {
      room = {
        id: key,
        participants: new Map(),
        passphrase: data.passphrase,
        createdAt: Date.now(),
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
    console.log(`[Signaling] ${data.displayName} joined room ${key} (${room.participants.size} users)`);
  });

  // --- Room Join by ID (direct) ---
  socket.on('room:join-direct', (data: { roomId: string; displayName: string }, ack) => {
    const key = data.roomId;
    let room = rooms.get(key);

    if (!room) {
      room = {
        id: key,
        participants: new Map(),
        passphrase: [],
        createdAt: Date.now(),
      };
      rooms.set(key, room);
    }

    room.participants.set(socket.id, {
      socketId: socket.id,
      displayName: data.displayName,
    });

    socket.join(key);
    socket.to(key).emit('participant:joined', {
      id: socket.id,
      displayName: data.displayName,
    });

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
          // Keep for 5 min before cleanup
          room.createdAt = Date.now();
        }
        break;
      }
    }
    console.log(`[Signaling] Disconnected: ${socket.id} (total: ${io.engine.clientsCount})`);
  });
});

httpServer.listen(port, () => {
  console.log(`\n🏠 kokoro signaling server (production-ready)`);
  console.log(`   Port: ${port}`);
  console.log(`   CORS: ${allowedOrigins.join(', ')}`);
  console.log(`   Health: http://localhost:${port}/health`);
});
