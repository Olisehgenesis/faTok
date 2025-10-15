import { createServer } from 'http';
import MediaSoupServer from './lib/mediasoup-server';

const port = parseInt(process.env.MEDIASOUP_PORT || '3004', 10);

// Create HTTP server for MediaSoup
const server = createServer();

// Initialize MediaSoup server
const mediaSoupServer = new MediaSoupServer();
mediaSoupServer.initialize(server);

// Start server
server.listen(port, () => {
  console.log(`🎥 MediaSoup server running on port ${port}`);
  console.log(`📡 Socket.IO available at ws://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('MediaSoup server shutting down...');
  await mediaSoupServer.close();
  server.close(() => {
    console.log('MediaSoup server terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('MediaSoup server shutting down...');
  await mediaSoupServer.close();
  server.close(() => {
    console.log('MediaSoup server terminated');
  });
});
