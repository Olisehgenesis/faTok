"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { clientSessionActions, useClientSession } from "@/app/store/clientSession";
import { IonSFURoomManager } from "@/lib/ion-sfu-utils";

export default function JoinRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = useMemo(() => params?.roomId ?? "", [params]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { chatMessages } = useClientSession();
  const [chatInput, setChatInput] = useState("");

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLogs(prev => [...prev.slice(-9), logMessage]); // Keep last 10 logs
  };

  useEffect(() => {
    let cancelled = false;
    let sessionId: string | null = null;
    let ionSFURoom: IonSFURoomManager | null = null;

    async function init() {
      if (!roomId) return;
      
      // This route is creator-only
      setIsCreator(true);
      
      // Simulate device connect on mount and log session start
      clientSessionActions.incrementDevices();
      setStatus("loading");
      try {
        const startRes = await fetch("/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "session_start",
            roomId,
            role: "creator",
            userAgent: navigator.userAgent,
          }),
        });
        const startJson = await startRes.json();
        sessionId = startJson?.session?.id ?? null;
      } catch {}
      
      try {
        // Initialize Ion-SFU room manager
        addDebugLog("🔌 Connecting to Ion-SFU server...");
        ionSFURoom = new IonSFURoomManager({
          serverUrl: 'ws://localhost:7000/ws',
          resolution: 'hd',
          codec: 'vp8',
          audio: true,
          video: true
        });
        
        // Set up track callback for local video display
        ionSFURoom.setOnTrack((track: MediaStreamTrack, stream: MediaStream) => {
          addDebugLog("📺 Track received!");
          console.log("📺 Track received:", {
            id: track.id,
            kind: track.kind,
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
        });
        
        // Create room and join as broadcaster
        addDebugLog("🏠 Creating room...");
        await ionSFURoom.createRoom(roomId);
        
        if (cancelled) return;

        // CREATOR: Start camera broadcasting
        addDebugLog("🎥 Creator mode: Starting broadcast");
        console.log("🎥 Creator mode: Starting broadcast");
        
        const stream = await ionSFURoom.startCamera({
          resolution: 'hd',
          codec: 'vp8',
          audio: true,
          video: true
        });
        
        addDebugLog("✅ Camera access granted!");
        console.log("✅ Camera access granted!");
        console.log("📹 Video tracks:", stream.getVideoTracks().length);
        console.log("🎵 Audio tracks:", stream.getAudioTracks().length);
        
        if (stream.getVideoTracks().length > 0) {
          const videoTrack = stream.getVideoTracks()[0];
          console.log("📹 Video track details:", {
            id: videoTrack.id,
            kind: videoTrack.kind,
            label: videoTrack.label,
            enabled: videoTrack.enabled,
            muted: videoTrack.muted,
            readyState: videoTrack.readyState
          });
        }
        
        if (cancelled) return;
        if (videoRef.current) {
          console.log("🎬 Setting up video element for creator...");
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          
          // Add event listeners for debugging
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log(`📹 Creator video loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
            console.log(`📹 Video duration: ${videoRef.current?.duration}`);
            addDebugLog(`📹 Video loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
          });
          
          videoRef.current.addEventListener('canplay', () => {
            console.log("🎬 Creator video can play");
            addDebugLog("🎬 Video can play");
          });
          
          videoRef.current.addEventListener('playing', () => {
            console.log("▶️ Creator video is playing");
            addDebugLog("▶️ Video is playing");
          });
          
          videoRef.current.addEventListener('error', (e) => {
            console.error("❌ Creator video error:", e);
            addDebugLog("❌ Video error");
          });
          
          await videoRef.current.play().catch((err) => {
            console.error("❌ Failed to play creator video:", err);
            addDebugLog("❌ Failed to play video");
          });
        }
        
        setStatus("broadcasting");
        addDebugLog("✅ Broadcasting started");

        console.log("Ion-SFU room initialized successfully");
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        setStatus("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      clientSessionActions.decrementDevices();
      
      // Cleanup Ion-SFU resources
      if (ionSFURoom) {
        ionSFURoom.leaveRoom();
      }
      
      // Log session end
      if (sessionId) {
        fetch("/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "session_end", roomId, sessionId }),
        }).catch(() => {});
      }
    };
  }, [roomId]);

  return (
    <div className="relative min-h-screen">
      {/* Full-screen video */}
      <div className="fixed inset-0 z-0">
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          className="w-full h-full object-cover bg-black" 
        />
      </div>

      {/* Mobile overlay - transparent chat */}
      <div className="fixed inset-0 z-10 md:hidden">
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <h2 className="font-medium mb-2 text-white">Chat</h2>
            <div className="space-y-2 max-h-32 overflow-auto pr-1">
              {chatMessages.length === 0 && (
                <div className="text-sm opacity-60 text-white">No messages yet</div>
              )}
              {chatMessages.map((m) => (
                <div key={m.id} className="text-sm text-white">
                  <span className="font-semibold text-blue-300">{m.sender}: </span>
                  <span>{m.text}</span>
                </div>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                const text = chatInput.trim();
                if (!text) return;
                clientSessionActions.appendMessage("You", text);
                setChatInput("");
              }}
            >
              <input
                className="flex-1 rounded border border-white/30 px-2 py-1 bg-white/10 text-white placeholder-white/60"
                placeholder="Type a message"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button className="rounded bg-white/20 text-white px-3 py-1">Send</button>
            </form>
          </div>
        </div>
      </div>

      {/* Desktop overlay - colored chat */}
      <div className="hidden md:block fixed top-20 right-4 z-10 w-80">
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-lg">
          <h2 className="font-medium mb-2">Chat</h2>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {chatMessages.length === 0 && (
              <div className="text-sm opacity-60">No messages yet</div>
            )}
            {chatMessages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-semibold text-blue-600">{m.sender}: </span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const text = chatInput.trim();
              if (!text) return;
              clientSessionActions.appendMessage("You", text);
              setChatInput("");
              // Persist message
              fetch("/api/event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "message", roomId, sender: "You", text }),
              }).catch(() => {});
            }}
          >
            <input
              className="flex-1 rounded border px-2 py-1 bg-transparent"
              placeholder="Type a message"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button className="rounded bg-foreground text-background px-3 py-1">Send</button>
          </form>
        </div>
      </div>

      {/* Room info overlay */}
      <div className="fixed top-20 left-4 z-10">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 text-white">
          <h1 className="text-lg font-semibold mb-1">
            Room: {roomId || "(missing)"} 
            <span className="text-yellow-300 ml-2">🎥 LIVE</span>
          </h1>
          <div className="text-sm opacity-80">
            Status: {status} (Broadcaster)
          </div>
          {error && (
            <div className="text-red-300 text-sm mt-1" role="alert">{error}</div>
          )}
        </div>
      </div>

      {/* Debug panel */}
      <div className="fixed bottom-4 right-4 z-20 w-80 max-h-60 overflow-auto">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
          <h3 className="font-medium mb-2 text-green-300">Debug Logs</h3>
          <div className="space-y-1">
            {debugLogs.length === 0 && (
              <div className="opacity-60">No logs yet</div>
            )}
            {debugLogs.map((log, i) => (
              <div key={i} className="font-mono text-xs break-words">
                {log}
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-white/20">
            <button 
              onClick={() => {
                addDebugLog("🔍 Testing Ion-SFU connection...");
                addDebugLog("📡 Ion-SFU uses WebSocket signaling, no manual test needed");
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


