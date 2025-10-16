"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateRoomId } from "@/lib/room-utils";
import { IonSFURoomManager, RoomUtils } from "@/lib/ion-sfu-utils";

export default function TestPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string>("");
  const [creatorStatus, setCreatorStatus] = useState("idle");
  const [viewerStatus, setViewerStatus] = useState("idle");
  const [creatorLogs, setCreatorLogs] = useState<string[]>([]);
  const [viewerLogs, setViewerLogs] = useState<string[]>([]);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  
  const creatorVideoRef = useRef<HTMLVideoElement | null>(null);
  const viewerVideoRef = useRef<HTMLVideoElement | null>(null);
  
  let creatorRoom: IonSFURoomManager | null = null;
  let viewerRoom: IonSFURoomManager | null = null;

  const addCreatorLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`[CREATOR] ${logMessage}`);
    setCreatorLogs(prev => [...prev.slice(-9), logMessage]);
  };

  const addViewerLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`[VIEWER] ${logMessage}`);
    setViewerLogs(prev => [...prev.slice(-9), logMessage]);
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    addCreatorLog(`🏠 Created room: ${newRoomId}`);
    addViewerLog(`🏠 Room available: ${newRoomId}`);
  };

  const startCreator = async () => {
    if (!roomId) {
      addCreatorLog("❌ No room ID");
      return;
    }

    try {
      setCreatorStatus("connecting");
      addCreatorLog("🔌 Connecting creator...");

      // Create room manager for creator
      creatorRoom = new IonSFURoomManager({
        serverUrl: 'ws://localhost:7000/ws',
        resolution: 'hd',
        codec: 'vp8',
        audio: true,
        video: true
      });

      // Set up track callback for local video display
      creatorRoom.setOnTrack((track: MediaStreamTrack, stream: MediaStream) => {
        addCreatorLog(`📺 Local track: ${track.kind}`);
      });

      // Create room and join
      addCreatorLog("🏠 Creating room...");
      await creatorRoom.createRoom(roomId);

      // Start camera publishing
      addCreatorLog("📱 Starting camera...");
      const stream = await creatorRoom.startCamera();

      // Display local video
      if (creatorVideoRef.current) {
        creatorVideoRef.current.srcObject = stream;
        creatorVideoRef.current.setAttribute('playsinline', 'true');
        creatorVideoRef.current.setAttribute('webkit-playsinline', 'true');
        
        creatorVideoRef.current.addEventListener('loadedmetadata', () => {
          addCreatorLog(`📹 Video loaded: ${creatorVideoRef.current?.videoWidth}x${creatorVideoRef.current?.videoHeight}`);
        });
        
        creatorVideoRef.current.addEventListener('playing', () => {
          addCreatorLog("▶️ Video is playing");
        });
        
        await creatorVideoRef.current.play().catch((err) => {
          addCreatorLog(`❌ Failed to play video: ${err}`);
        });
      }

      setCreatorStatus("broadcasting");
      addCreatorLog("✅ Creator broadcasting");

    } catch (error: any) {
      setCreatorStatus("error");
      setCreatorError(error?.message ?? String(error));
      addCreatorLog(`❌ Error: ${error?.message ?? String(error)}`);
    }
  };

  const startViewer = async () => {
    if (!roomId) {
      addViewerLog("❌ No room ID");
      return;
    }

    try {
      setViewerStatus("connecting");
      addViewerLog("🔌 Connecting viewer...");

      // Create room manager for viewer
      viewerRoom = new IonSFURoomManager({
        serverUrl: 'ws://localhost:7000/ws',
        resolution: 'hd',
        codec: 'vp8',
        audio: true,
        video: true
      });

      // Set up track callback for remote video display
      viewerRoom.setOnTrack((track: MediaStreamTrack, stream: MediaStream) => {
        addViewerLog("📺 Track received!");
        console.log("📺 Track received:", {
          id: track.id,
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
        
        if (viewerVideoRef.current) {
          console.log("🎬 Setting up video element for viewer...");
          viewerVideoRef.current.srcObject = stream;
          viewerVideoRef.current.setAttribute('playsinline', 'true');
          viewerVideoRef.current.setAttribute('webkit-playsinline', 'true');
          
          viewerVideoRef.current.addEventListener('loadedmetadata', () => {
            console.log(`📹 Viewer video loaded: ${viewerVideoRef.current?.videoWidth}x${viewerVideoRef.current?.videoHeight}`);
            addViewerLog(`📹 Video loaded: ${viewerVideoRef.current?.videoWidth}x${viewerVideoRef.current?.videoHeight}`);
          });
          
          viewerVideoRef.current.addEventListener('canplay', () => {
            console.log("🎬 Viewer video can play");
            addViewerLog("🎬 Video can play");
          });
          
          viewerVideoRef.current.addEventListener('playing', () => {
            console.log("▶️ Viewer video is playing");
            addViewerLog("▶️ Video is playing");
          });
          
          viewerVideoRef.current.addEventListener('error', (e) => {
            console.error("❌ Viewer video error:", e);
            addViewerLog("❌ Video error");
          });
          
          viewerVideoRef.current.play().catch((err) => {
            console.error("❌ Failed to play viewer video:", err);
            addViewerLog("❌ Failed to play video");
          });
          
          console.log('🎥 Video stream displayed');
          addViewerLog('🎥 Video stream displayed');
        }
      });
      
      // Join room as viewer
      addViewerLog("🚪 Joining room...");
      await viewerRoom.joinRoom(roomId);

      // Start subscribing
      addViewerLog("👀 Starting subscription...");
      await viewerRoom.startSubscribing();

      setViewerStatus("viewing");
      addViewerLog("✅ Viewer ready");

    } catch (error: any) {
      setViewerStatus("error");
      setViewerError(error?.message ?? String(error));
      addViewerLog(`❌ Error: ${error?.message ?? String(error)}`);
    }
  };

  const cleanupAll = () => {
    addCreatorLog("🧹 Cleaning up creator...");
    addViewerLog("🧹 Cleaning up viewer...");
    
    if (creatorRoom) {
      creatorRoom.leaveRoom();
      creatorRoom = null;
    }
    
    if (viewerRoom) {
      viewerRoom.leaveRoom();
      viewerRoom = null;
    }
    
    setCreatorStatus("idle");
    setViewerStatus("idle");
    setCreatorError(null);
    setViewerError(null);
    
    if (creatorVideoRef.current) {
      creatorVideoRef.current.srcObject = null;
    }
    
    if (viewerVideoRef.current) {
      viewerVideoRef.current.srcObject = null;
    }
  };

  const testConnection = () => {
    addCreatorLog("🔍 Testing Ion-SFU connection...");
    addViewerLog("🔍 Testing Ion-SFU connection...");
    
    fetch('http://localhost:7000')
      .then(response => {
        if (response.status === 404) {
          addCreatorLog("✅ Ion-SFU server is running (404 expected)");
          addViewerLog("✅ Ion-SFU server is running (404 expected)");
        } else {
          addCreatorLog(`📡 Ion-SFU server response: ${response.status}`);
          addViewerLog(`📡 Ion-SFU server response: ${response.status}`);
        }
      })
      .catch(error => {
        addCreatorLog(`❌ Ion-SFU server not reachable: ${error.message}`);
        addViewerLog(`❌ Ion-SFU server not reachable: ${error.message}`);
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VexoSocial</h1>
          <p className="text-gray-600 mb-4">Ion-SFU Live Streaming Test</p>
          <div className="text-sm text-gray-500">
            Devices: {creatorStatus === "broadcasting" ? 1 : 0}
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">VexoSocial Debug Test Page</h2>
          
          <div className="space-x-4 mb-4">
            <button
              onClick={createRoom}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Create Room
            </button>
            
            <button
              onClick={cleanupAll}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Cleanup All
            </button>
            
            <button
              onClick={testConnection}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Test Connection
            </button>
          </div>

          {roomId && (
            <div className="text-lg font-semibold text-gray-700 mb-4">
              Room ID: {roomId}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Creator Column */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              🎥 Creator (Broadcaster)
            </h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                Status: <span className={`font-semibold ${
                  creatorStatus === "broadcasting" ? "text-green-600" :
                  creatorStatus === "connecting" ? "text-yellow-600" :
                  creatorStatus === "error" ? "text-red-600" : "text-gray-600"
                }`}>{creatorStatus}</span>
              </div>
              
              <button
                onClick={startCreator}
                disabled={!roomId || creatorStatus === "connecting" || creatorStatus === "broadcasting"}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium w-full"
              >
                Start Broadcasting
              </button>
            </div>

            <div className="mb-4">
              <video
                ref={creatorVideoRef}
                className="w-full h-48 bg-gray-200 rounded-lg object-cover"
                muted
                playsInline
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Creator Logs:</h4>
              <div className="space-y-1 max-h-40 overflow-auto text-xs font-mono">
                {creatorLogs.length === 0 && (
                  <div className="text-gray-500">No logs yet</div>
                )}
                {creatorLogs.map((log, i) => (
                  <div key={i} className="text-gray-700">{log}</div>
                ))}
              </div>
              {creatorError && (
                <div className="text-red-600 text-sm mt-2 font-semibold">
                  Error: {creatorError}
                </div>
              )}
            </div>
          </div>

          {/* Viewer Column */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              👀 Viewer
            </h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                Status: <span className={`font-semibold ${
                  viewerStatus === "viewing" ? "text-green-600" :
                  viewerStatus === "connecting" ? "text-yellow-600" :
                  viewerStatus === "error" ? "text-red-600" : "text-gray-600"
                }`}>{viewerStatus}</span>
              </div>
              
              <button
                onClick={startViewer}
                disabled={!roomId || viewerStatus === "connecting" || viewerStatus === "viewing"}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium w-full"
              >
                Start Viewing
              </button>
            </div>

            <div className="mb-4">
              <video
                ref={viewerVideoRef}
                className="w-full h-48 bg-gray-200 rounded-lg object-cover"
                muted
                playsInline
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Viewer Logs:</h4>
              <div className="space-y-1 max-h-40 overflow-auto text-xs font-mono">
                {viewerLogs.length === 0 && (
                  <div className="text-gray-500">No logs yet</div>
                )}
                {viewerLogs.map((log, i) => (
                  <div key={i} className="text-gray-700">{log}</div>
                ))}
              </div>
              {viewerError && (
                <div className="text-red-600 text-sm mt-2 font-semibold">
                  Error: {viewerError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Click "Create Room" to generate a room ID</li>
            <li>Click "Start Broadcasting" in the Creator column</li>
            <li>Click "Start Viewing" in the Viewer column</li>
            <li>Use "Test Connection" to check Ion-SFU server status</li>
            <li>Watch the logs to see the Ion-SFU flow</li>
            <li>Click "Cleanup All" to reset everything</li>
          </ol>
        </div>
      </div>
    </div>
  );
}