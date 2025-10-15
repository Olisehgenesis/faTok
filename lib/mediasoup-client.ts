import { Device } from 'mediasoup-client';

export class MediaSoupClient {
  private device: Device | null = null;
  private socket: any = null;
  private producer: any = null;
  private consumer: any = null;
  private transport: any = null;
  private roomId: string = '';
  private rtpCapabilities: any = null;

  constructor(socket: any) {
    this.socket = socket;
  }

  async initialize(roomId: string) {
    this.roomId = roomId;
    
    // Load device
    this.device = new Device();
    
    // Join room and get router RTP capabilities
    return new Promise((resolve, reject) => {
      this.socket.emit('join-room', { roomId });
      
      this.socket.on('transport-created', async (data: any) => {
        try {
          // Store RTP capabilities for later use
          this.rtpCapabilities = data.rtpCapabilities;
          
          // Load device with router capabilities
          await this.device!.load({ routerRtpCapabilities: data.rtpCapabilities });
          
          // Create transport
          this.transport = this.device!.createSendTransport(data);
          
          // Handle transport events
          this.transport.on('connect', async ({ dtlsParameters }: any) => {
            this.socket.emit('connect-transport', { dtlsParameters });
          });

          this.transport.on('produce', async ({ kind, rtpParameters }: any) => {
            this.socket.emit('produce', { kind, rtpParameters });
          });

          resolve(this.transport);
        } catch (error) {
          reject(error);
        }
      });

      this.socket.on('error', (error: any) => {
        reject(error);
      });
    });
  }

  async startProducing(stream: MediaStream) {
    if (!this.transport || !this.device) {
      throw new Error('Transport or device not initialized');
    }

    // Produce video track
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      this.producer = await this.transport.produce({
        track: videoTrack,
        encodings: [
          {
            rid: 'r0',
            maxBitrate: 1000000,
            scalabilityMode: 'S1T3',
          },
          {
            rid: 'r1',
            maxBitrate: 500000,
            scalabilityMode: 'S1T3',
          },
          {
            rid: 'r2',
            maxBitrate: 250000,
            scalabilityMode: 'S1T3',
          },
        ],
      });
    }

    // Produce audio track
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      await this.transport.produce({
        track: audioTrack,
      });
    }

    return this.producer;
  }

  async startConsuming() {
    if (!this.device) {
      throw new Error('Device not initialized');
    }

    // Listen for new producers
    this.socket.on('new-producer', async (data: any) => {
      try {
        const { producerId, kind } = data;
        
        // Create consumer transport - we'll get proper parameters from server
        const consumerTransport = this.device!.createRecvTransport({
          id: 'consumer-transport',
          iceParameters: { usernameFragment: '', password: '' }, // Will be set by server
          iceCandidates: [],
          dtlsParameters: { fingerprints: [] }, // Will be set by server
        });

        // Connect consumer transport
        consumerTransport.on('connect', async ({ dtlsParameters }: any) => {
          this.socket.emit('connect-transport', { dtlsParameters });
        });

        // Create consumer
        this.socket.emit('consume', {
          producerId,
          rtpCapabilities: this.device!.rtpCapabilities,
        });

        this.socket.on('consumer-created', async (data: any) => {
          const { id, producerId, kind, rtpParameters } = data;
          
          this.consumer = await consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
          });

          // Resume consumer
          this.socket.emit('resume-consumer', { consumerId: id });
          
          return this.consumer;
        });
      } catch (error) {
        console.error('Error creating consumer:', error);
      }
    });
  }

  getConsumerTrack() {
    return this.consumer?.track;
  }

  async cleanup() {
    if (this.producer) {
      this.producer.close();
    }
    if (this.consumer) {
      this.consumer.close();
    }
    if (this.transport) {
      this.transport.close();
    }
  }
}
