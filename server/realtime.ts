import http from 'http';
import { Server } from 'socket.io';
import { prisma } from '../app/lib/db';

const PORT = process.env.CHAT_PORT ? Number(process.env.CHAT_PORT) : 7002;

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3002',
      'http://localhost:4043',
      'vexo.social',
      
      'https://vexo.social',
      'http://192.168.1.100:3002',
      'http://192.168.1.100:4043',
      'http://192.168.1.100:3002',
    ],
    methods: ['GET', 'POST'],
  },
});

type ChatMessage = {
  id: string;
  roomId: string;
  sender: string;
  text: string;
  createdAt: string;
};

io.on('connection', (socket) => {
  socket.on('join', async ({ roomId, name }: { roomId: string; name?: string }) => {
    if (!roomId) return;
    socket.join(roomId);
    const count = (io.sockets.adapter.rooms.get(roomId)?.size || 0);
    io.to(roomId).emit('presence:update', { roomId, viewers: count });
  });

  socket.on('leave', ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    socket.leave(roomId);
    const count = (io.sockets.adapter.rooms.get(roomId)?.size || 0);
    io.to(roomId).emit('presence:update', { roomId, viewers: count });
  });

  socket.on('chat:message', async ({ roomId, sender, text }: { roomId: string; sender: string; text: string }) => {
    if (!roomId || !text) return;
    const sanitizedText = String(text).slice(0, 2000);
    const sanitizedSender = (sender ? String(sender) : 'Anon').slice(0, 64);

    // Persist
    const saved = await prisma.message.create({ data: { roomId, sender: sanitizedSender, text: sanitizedText } });
    const payload: ChatMessage = {
      id: saved.id,
      roomId: saved.roomId,
      sender: saved.sender,
      text: saved.text,
      createdAt: saved.createdAt.toISOString(),
    };

    io.to(roomId).emit('chat:message', payload);
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const size = io.sockets.adapter.rooms.get(roomId)?.size || 1;
      const next = Math.max(0, size - 1);
      io.to(roomId).emit('presence:update', { roomId, viewers: next });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Realtime chat server listening on :${PORT}`);
});
