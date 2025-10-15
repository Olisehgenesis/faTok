const mediasoup = require('mediasoup');
const { Server: SocketIOServer } = require('socket.io');
const { Server: HTTPServer } = require('http');

// MediaSoup configuration
const mediasoupConfig = {
  worker: {
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
    logLevel: 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
    ],
  },
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
          'profile-id': 2,
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ],
  },
  webRtcTransport: {
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
      },
    ],
    maxIncomingBitrate: 1500000,
    initialAvailableOutgoingBitrate: 1000000,
  },
};

class MediaSoupServer {
  private worker: mediasoup.types.Worker | null = null;
  private io: SocketIOServer | null = null;
  private rooms = new Map<string, {
    router: mediasoup.types.Router;
    producer: mediasoup.types.Producer | null;
    consumers: Set<mediasoup.types.Consumer>;
  }>();

  async initialize(httpServer: HTTPServer) {
    // Create MediaSoup worker
    this.worker = await mediasoup.createWorker({
      ...mediasoupConfig.worker,
    });

    this.worker.on('died', () => {
      console.error('MediaSoup worker died, exiting in 2 seconds...');
      setTimeout(() => process.exit(1), 2000);
    });

    // Create Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    console.log('MediaSoup server initialized');
  }

  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join-room', async (data: { roomId: string }) => {
        try {
          const { roomId } = data;
          
          // Get or create room
          let room = this.rooms.get(roomId);
          if (!room) {
            const router = await this.worker!.createRouter({
              mediaCodecs: mediasoupConfig.router.mediaCodecs,
            });
            room = {
              router,
              producer: null,
              consumers: new Set(),
            };
            this.rooms.set(roomId, room);
            console.log(`Created room: ${roomId}`);
          }

          // Create WebRTC transport for this client
          const transport = await room.router.createWebRtcTransport({
            ...mediasoupConfig.webRtcTransport,
          });

          // Store transport info
          socket.data = {
            roomId,
            transport,
            room,
          };

          socket.emit('transport-created', {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            rtpCapabilities: room.router.rtpCapabilities,
          });

          console.log(`Client ${socket.id} joined room ${roomId}`);
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('connect-transport', async (data: { dtlsParameters: any }) => {
        try {
          const transport = socket.data?.transport;
          if (!transport) {
            throw new Error('No transport found');
          }

          await transport.connect({ dtlsParameters: data.dtlsParameters });
          console.log(`Transport connected for ${socket.id}`);
        } catch (error) {
          console.error('Error connecting transport:', error);
          socket.emit('error', { message: 'Failed to connect transport' });
        }
      });

      socket.on('produce', async (data: { kind: string; rtpParameters: any }) => {
        try {
          const { room, transport } = socket.data;
          if (!room || !transport) {
            throw new Error('No room or transport found');
          }

          const producer = await transport.produce({
            kind: data.kind,
            rtpParameters: data.rtpParameters,
          });

          room.producer = producer;
          console.log(`Producer created for ${socket.id}: ${producer.id}`);

          socket.emit('producer-created', { id: producer.id });

          // Notify all other clients in the room about the new producer
          socket.to(socket.data.roomId).emit('new-producer', {
            producerId: producer.id,
            kind: producer.kind,
          });

        } catch (error) {
          console.error('Error creating producer:', error);
          socket.emit('error', { message: 'Failed to create producer' });
        }
      });

      socket.on('consume', async (data: { producerId: string; rtpCapabilities: any }) => {
        try {
          const { room, transport } = socket.data;
          if (!room || !transport) {
            throw new Error('No room or transport found');
          }

          if (!room.router.canConsume({
            producerId: data.producerId,
            rtpCapabilities: data.rtpCapabilities,
          })) {
            throw new Error('Cannot consume');
          }

          const consumer = await transport.consume({
            producerId: data.producerId,
            rtpCapabilities: data.rtpCapabilities,
            paused: true,
          });

          room.consumers.add(consumer);

          socket.emit('consumer-created', {
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          });

          console.log(`Consumer created for ${socket.id}: ${consumer.id}`);

        } catch (error) {
          console.error('Error creating consumer:', error);
          socket.emit('error', { message: 'Failed to create consumer' });
        }
      });

      socket.on('resume-consumer', async (data: { consumerId: string }) => {
        try {
          const { room } = socket.data;
          if (!room) return;

          const consumer = Array.from(room.consumers).find((c: any) => c.id === data.consumerId);
          if (consumer) {
            await consumer.resume();
            console.log(`Consumer resumed: ${consumer.id}`);
          }
        } catch (error) {
          console.error('Error resuming consumer:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Clean up resources
        const { room } = socket.data;
        if (room) {
          // Remove consumers created by this client
          room.consumers.forEach((consumer: any) => {
            if (consumer.transport.id === socket.data?.transport?.id) {
              consumer.close();
              room.consumers.delete(consumer);
            }
          });
        }
      });
    });
  }

  async close() {
    if (this.worker) {
      this.worker.close();
    }
    if (this.io) {
      this.io.close();
    }
  }
}

module.exports = MediaSoupServer;
