import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173', 'https://escrow-x-pro-stellar-milestone-escr.vercel.app', 'https://escrow-x-pro-stellar-milestone-escr.vercel.app/']
  }
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'escrowx-event-listener' });
});

app.post('/events/contract', (req, res) => {
  io.emit('contract:event', req.body);
  res.status(202).json({ accepted: true });
});

io.on('connection', (socket) => {
  socket.emit('contract:event', {
    id: `evt_socket_${Date.now()}`,
    type: 'job_created',
    title: 'Event stream connected',
    detail: 'Socket.IO is listening for Soroban contract events.',
    createdAt: new Date().toISOString()
  });
});

const port = Number(process.env.PORT ?? 8787);
httpServer.listen(port, () => {
  console.log(`EscrowX event listener running on http://127.0.0.1:${port}`);
});
