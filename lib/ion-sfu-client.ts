// Dynamic import for Ion-SFU SDK to avoid SSR issues
let Client: any = null;
let LocalStream: any = null;
let IonSFUJSONRPCSignal: any = null;

async function loadIonSDK() {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment');
    return null;
  }
  
  if (!Client) {
    try {
      console.log('📦 Loading Ion-SFU SDK...');
      const ionSDK = await import('ion-sdk-js');
      const signalModule = await import('ion-sdk-js/lib/signal/json-rpc-impl');
      
      console.log('📦 Ion-SFU SDK loaded, available exports:', Object.keys(ionSDK));
      
      Client = ionSDK.Client;
      LocalStream = ionSDK.LocalStream;
      IonSFUJSONRPCSignal = signalModule.IonSFUJSONRPCSignal;
      
      console.log('✅ Ion-SFU SDK components loaded');
    } catch (error) {
      console.error('❌ Failed to import Ion-SFU SDK:', error);
      throw error;
    }
  }
  
  return { Client, LocalStream, IonSFUJSONRPCSignal };
}

export class IonSFUClient {
  private client: any | null = null;
  private signal: any | null = null;
  private sessionId: string = '';
  private onTrack: ((track: MediaStreamTrack, stream: MediaStream) => void) | null = null;

  constructor() {
    // Initialize Ion-SFU client
  }

  async initialize(sessionId: string, serverUrl: string = 'ws://localhost:7000/ws') {
    this.sessionId = sessionId;
    
    console.log('🚀 Initializing Ion-SFU client...');
    console.log(`📡 Connecting to: ${serverUrl}`);
    console.log(`🏠 Session ID: ${sessionId}`);

    try {
      // Load Ion-SFU SDK dynamically
      console.log('📦 Attempting to load Ion-SFU SDK...');
      const sdkComponents = await loadIonSDK();
      
      if (!sdkComponents) {
        throw new Error('Failed to load Ion-SFU SDK - not in browser environment');
      }
      
      const { Client: ClientClass, IonSFUJSONRPCSignal: SignalClass } = sdkComponents;
      
      if (!ClientClass || !SignalClass) {
        throw new Error('Failed to load Ion-SFU SDK components');
      }
      
      console.log('✅ Ion-SFU SDK components loaded successfully');
      
      // Create signaling connection
      this.signal = new SignalClass(serverUrl);
      
      // Create Ion-SFU client with signal and config (not sessionId)
      const config = {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      };
      
      this.client = new ClientClass(this.signal, config);
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Join the session when signal opens
      this.signal.onopen = () => {
        console.log('🔗 Signal connected, joining session...');
        this.client.join(sessionId);
      };
      
      console.log('✅ Ion-SFU client initialized');
      return this.client;
    } catch (error) {
      console.error('❌ Error initializing Ion-SFU client:', error);
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.client || !this.signal) return;

    // Handle connection open
    this.signal.onopen = async () => {
      console.log('🔗 Ion-SFU signal connected');
      console.log(`✅ Connected to session: ${this.sessionId}`);
    };

    // Handle connection close
    this.signal.onclose = () => {
      console.log('❌ Ion-SFU signal disconnected');
    };

    // Handle connection error
    this.signal.onerror = (error: any) => {
      console.error('❌ Ion-SFU signal error:', error);
    };

    // Handle incoming tracks
    this.client.ontrack = (track: MediaStreamTrack, stream: MediaStream) => {
      console.log('📺 Received track:', {
        id: track.id,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
      
      if (this.onTrack) {
        this.onTrack(track, stream);
      }
    };

    // Handle peer connection state changes
    this.client.onconnectionstatechange = (state: string) => {
      console.log('🔗 Connection state changed:', state);
    };

    // Handle ICE connection state changes
    this.client.oniceconnectionstatechange = (state: string) => {
      console.log('🧊 ICE connection state changed:', state);
    };
  }

  async startPublishing(stream: MediaStream) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log('🎬 Starting to publish stream...');
    console.log('📹 Video tracks:', stream.getVideoTracks().length);
    console.log('🎵 Audio tracks:', stream.getAudioTracks().length);

    try {
      // Load Ion-SFU SDK dynamically
      const { LocalStream: LocalStreamClass } = await loadIonSDK();
      
      if (!LocalStreamClass) {
        throw new Error('Failed to load Ion-SFU SDK');
      }
      
      // Publish the stream directly (LocalStream handles MediaStream internally)
      await this.client.publish(stream);
      console.log('✅ Stream published successfully');
      
      return stream;
    } catch (error) {
      console.error('❌ Error publishing stream:', error);
      throw error;
    }
  }

  async startCameraPublishing(options: any = {}) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log('📱 Starting camera publishing...');

    try {
      // Load Ion-SFU SDK dynamically
      const { LocalStream: LocalStreamClass } = await loadIonSDK();
      
      if (!LocalStreamClass) {
        throw new Error('Failed to load Ion-SFU SDK');
      }
      
      // Use LocalStream.getUserMedia for camera
      const media = await LocalStreamClass.getUserMedia({
        resolution: options.resolution || 'vga',
        audio: options.audio !== false,
        codec: options.codec || "vp8"
      });
      
      await this.client.publish(media);
      console.log('✅ Camera stream published successfully');
      
      return media;
    } catch (error) {
      console.error('❌ Error publishing camera stream:', error);
      throw error;
    }
  }

  async startScreenPublishing(options: any = {}) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log('🖥️ Starting screen publishing...');

    try {
      // Load Ion-SFU SDK dynamically
      const { LocalStream: LocalStreamClass } = await loadIonSDK();
      
      if (!LocalStreamClass) {
        throw new Error('Failed to load Ion-SFU SDK');
      }
      
      // Use LocalStream.getDisplayMedia for screen sharing
      const media = await LocalStreamClass.getDisplayMedia({
        resolution: options.resolution || 'vga',
        video: options.video !== false,
        audio: options.audio !== false,
        codec: options.codec || "vp8"
      });
      
      await this.client.publish(media);
      console.log('✅ Screen stream published successfully');
      
      return media;
    } catch (error) {
      console.error('❌ Error publishing screen stream:', error);
      throw error;
    }
  }

  async startSubscribing() {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log('👀 Starting to subscribe to streams...');
    
    // The client will automatically receive tracks via the ontrack handler
    // No additional setup needed for subscribing
  }

  setOnTrack(callback: (track: MediaStreamTrack, stream: MediaStream) => void) {
    this.onTrack = callback;
  }

  async cleanup() {
    console.log('🧹 Cleaning up Ion-SFU client...');
    
    if (this.client) {
      try {
        await this.client.close();
        console.log('✅ Ion-SFU client closed');
      } catch (error) {
        console.error('❌ Error closing Ion-SFU client:', error);
      }
    }
    
    if (this.signal) {
      try {
        this.signal.close();
        console.log('✅ Ion-SFU signal closed');
      } catch (error) {
        console.error('❌ Error closing Ion-SFU signal:', error);
      }
    }
  }

  getClient() {
    return this.client;
  }

  getSignal() {
    return this.signal;
  }
}
