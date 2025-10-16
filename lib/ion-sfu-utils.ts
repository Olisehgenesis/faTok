import { IonSFUClient } from './ion-sfu-client';

export interface RoomConfig {
  serverUrl?: string;
  iceServers?: RTCIceServer[];
  resolution?: 'qvga' | 'vga' | 'hd' | 'fhd';
  codec?: 'vp8' | 'vp9' | 'h264';
  audio?: boolean;
  video?: boolean;
}

export interface RoomUser {
  id: string;
  name?: string;
  isPublisher?: boolean;
  isSubscriber?: boolean;
}

export class IonSFURoomManager {
  private client: IonSFUClient | null = null;
  private currentRoomId: string = '';
  private config: RoomConfig;
  private onTrackCallback?: (track: MediaStreamTrack, stream: MediaStream) => void;
  private onUserJoinCallback?: (user: RoomUser) => void;
  private onUserLeaveCallback?: (userId: string) => void;

  constructor(config: RoomConfig = {}) {
    this.config = {
      serverUrl: 'ws://localhost:7000/ws',
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ],
      resolution: 'vga',
      codec: 'vp8',
      audio: true,
      video: true,
      ...config
    };
  }

  /**
   * Join a room as a subscriber (viewer)
   */
  async joinRoom(roomId: string): Promise<void> {
    console.log(`🚪 Joining room: ${roomId}`);
    
    this.currentRoomId = roomId;
    this.client = new IonSFUClient();
    
    // Set up track callback
    this.client.setOnTrack((track: MediaStreamTrack, stream: MediaStream) => {
      console.log('📺 Track received in room:', {
        roomId: this.currentRoomId,
        trackId: track.id,
        trackKind: track.kind,
        streamId: stream.id
      });
      
      if (this.onTrackCallback) {
        this.onTrackCallback(track, stream);
      }
    });
    
    await this.client.initialize(roomId, this.config.serverUrl);
    console.log(`✅ Successfully joined room: ${roomId}`);
  }

  /**
   * Create a room and join as publisher
   */
  async createRoom(roomId: string): Promise<void> {
    console.log(`🏠 Creating room: ${roomId}`);
    await this.joinRoom(roomId);
  }

  /**
   * Start publishing camera stream
   */
  async startCamera(options: Partial<RoomConfig> = {}): Promise<MediaStream> {
    if (!this.client) {
      throw new Error('Not connected to any room');
    }

    const publishOptions = { ...this.config, ...options };
    return await this.client.startCameraPublishing(publishOptions);
  }

  /**
   * Start publishing screen share
   */
  async startScreenShare(options: Partial<RoomConfig> = {}): Promise<MediaStream> {
    if (!this.client) {
      throw new Error('Not connected to any room');
    }

    const publishOptions = { ...this.config, ...options };
    return await this.client.startScreenPublishing(publishOptions);
  }

  /**
   * Start subscribing to room streams
   */
  async startSubscribing(): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to any room');
    }

    await this.client.startSubscribing();
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    if (this.client) {
      this.client.cleanup();
      this.client = null;
    }
    this.currentRoomId = '';
    console.log('👋 Left room');
  }

  /**
   * Get current room ID
   */
  getCurrentRoomId(): string {
    return this.currentRoomId;
  }

  /**
   * Check if connected to a room
   */
  isConnected(): boolean {
    return this.client !== null && this.currentRoomId !== '';
  }

  /**
   * Set callback for incoming tracks
   */
  setOnTrack(callback: (track: MediaStreamTrack, stream: MediaStream) => void): void {
    this.onTrackCallback = callback;
  }

  /**
   * Set callback for user joining
   */
  setOnUserJoin(callback: (user: RoomUser) => void): void {
    this.onUserJoinCallback = callback;
  }

  /**
   * Set callback for user leaving
   */
  setOnUserLeave(callback: (userId: string) => void): void {
    this.onUserLeaveCallback = callback;
  }

  /**
   * Update room configuration
   */
  updateConfig(newConfig: Partial<RoomConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Utility functions for room management
 */
export class RoomUtils {
  /**
   * Generate a random room ID
   */
  static generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Validate room ID format
   */
  static isValidRoomId(roomId: string): boolean {
    return /^[A-Z0-9]{4,8}$/.test(roomId);
  }

  /**
   * Create a room URL
   */
  static createRoomUrl(roomId: string, baseUrl: string = window.location.origin): string {
    return `${baseUrl}/view/${roomId}`;
  }

  /**
   * Extract room ID from URL
   */
  static extractRoomIdFromUrl(url: string): string | null {
    const match = url.match(/\/view\/([A-Z0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if browser supports required features
   */
  static checkBrowserSupport(): { supported: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!navigator.mediaDevices) {
      issues.push('MediaDevices API not supported');
    }
    
    if (!navigator.mediaDevices?.getUserMedia) {
      issues.push('getUserMedia not supported');
    }
    
    if (!window.RTCPeerConnection) {
      issues.push('WebRTC not supported');
    }
    
    if (!window.WebSocket) {
      issues.push('WebSocket not supported');
    }
    
    return {
      supported: issues.length === 0,
      issues
    };
  }

  /**
   * Get available media devices
   */
  static async getMediaDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error) {
      console.error('Error getting media devices:', error);
      return [];
    }
  }

  /**
   * Get camera devices
   */
  static async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.getMediaDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  /**
   * Get microphone devices
   */
  static async getMicrophoneDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.getMediaDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }
}

/**
 * Pre-configured room manager instances
 */
export const createPublisherRoom = (config?: RoomConfig) => {
  const roomManager = new IonSFURoomManager(config);
  return roomManager;
};

export const createSubscriberRoom = (config?: RoomConfig) => {
  const roomManager = new IonSFURoomManager(config);
  return roomManager;
};

/**
 * Quick room operations
 */
export const RoomOperations = {
  /**
   * Quick join as viewer
   */
  async joinAsViewer(roomId: string, config?: RoomConfig) {
    const room = new IonSFURoomManager(config);
    await room.joinRoom(roomId);
    await room.startSubscribing();
    return room;
  },

  /**
   * Quick join as broadcaster
   */
  async joinAsBroadcaster(roomId: string, config?: RoomConfig) {
    const room = new IonSFURoomManager(config);
    await room.createRoom(roomId);
    await room.startCamera();
    return room;
  },

  /**
   * Quick screen share
   */
  async startScreenShare(roomId: string, config?: RoomConfig) {
    const room = new IonSFURoomManager(config);
    await room.createRoom(roomId);
    await room.startScreenShare();
    return room;
  }
};
