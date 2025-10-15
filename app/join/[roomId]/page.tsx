"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { clientSessionActions, useClientSession } from "@/app/store/clientSession";
import { MediaSoupClient } from "@/lib/mediasoup-client";
import { io } from "socket.io-client";

// Lazy import mediasoup-client only on client to avoid SSR issues
async function loadMediasoupClient() {
  const m = await import("mediasoup-client");
  return m;
}

export default function JoinRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = useMemo(() => params?.roomId ?? "", [params]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { chatMessages } = useClientSession();
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    let sessionId: string | null = null;
    let socket: any = null;
    let mediaSoupClient: MediaSoupClient | null = null;

    async function init() {
      if (!roomId) return;
      
      // Check if this is the creator (came from create page) or a joiner
      const isCreatorFromStorage = sessionStorage.getItem(`room-creator-${roomId}`) === 'true';
      setIsCreator(isCreatorFromStorage);
      
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
            role: isCreatorFromStorage ? "creator" : "viewer",
            userAgent: navigator.userAgent,
          }),
        });
        const startJson = await startRes.json();
        sessionId = startJson?.session?.id ?? null;
      } catch {}
      
      try {
        // Connect to Socket.IO server (MediaSoup server runs on port 3004)
        socket = io('http://localhost:3004');
        mediaSoupClient = new MediaSoupClient(socket);
        
        // Initialize MediaSoup client
        await mediaSoupClient.initialize(roomId);
        
        if (cancelled) return;

        if (isCreatorFromStorage) {
          // CREATOR: Access camera and start broadcasting
          console.log("🎥 Creator mode: Starting broadcast");
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
              facingMode: "user"
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000
            }
          });
          
          if (cancelled) return;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            await videoRef.current.play().catch(() => {});
            
            videoRef.current.addEventListener('loadedmetadata', () => {
              console.log(`📹 Broadcasting at: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
            });
          }
          
          // Start MediaSoup producer with this stream
          await mediaSoupClient.startProducing(stream);
          setStatus("broadcasting");
        } else {
          // VIEWER: Connect to view the stream
          console.log("👀 Viewer mode: Connecting to stream");
          
          // Start consuming the stream
          await mediaSoupClient.startConsuming();
          
          // Set up video element to display received stream
          const consumerTrack = mediaSoupClient.getConsumerTrack();
          if (consumerTrack && videoRef.current) {
            const stream = new MediaStream([consumerTrack]);
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            await videoRef.current.play().catch(() => {});
          } else {
            // Show placeholder while waiting
            if (videoRef.current) {
              videoRef.current.style.backgroundColor = '#000';
              videoRef.current.style.display = 'flex';
              videoRef.current.style.alignItems = 'center';
              videoRef.current.style.justifyContent = 'center';
              videoRef.current.style.color = 'white';
              videoRef.current.style.fontSize = '18px';
              videoRef.current.innerHTML = 'Waiting for stream...';
            }
          }
          
          setStatus("viewing");
        }

        console.log("MediaSoup client initialized successfully");
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
      
      // Cleanup MediaSoup resources
      if (mediaSoupClient) {
        mediaSoupClient.cleanup();
      }
      
      // Disconnect socket
      if (socket) {
        socket.disconnect();
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
            {isCreator && <span className="text-yellow-300 ml-2">🎥 LIVE</span>}
          </h1>
          <div className="text-sm opacity-80">
            Status: {status} {isCreator ? "(Broadcaster)" : "(Viewer)"}
          </div>
          {error && (
            <div className="text-red-300 text-sm mt-1" role="alert">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}


