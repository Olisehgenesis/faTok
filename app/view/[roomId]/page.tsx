"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { clientSessionActions, useClientSession } from "@/app/store/clientSession";
import { useRealtimeChat } from "@/app/hooks/useRealtimeChat";
import { IonSFUClient } from "@/lib/ion-sfu-client";

// Ion-SFU client - no lazy loading needed

export default function ViewRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = useMemo(() => params?.roomId ?? "", [params]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  // debug logs removed for production
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { chatMessages } = useClientSession();
  // Realtime chat (Socket.IO)
  const { messages: rtMessages, viewers, connected, sendMessage } = useRealtimeChat(roomId);

  const [chatInput, setChatInput] = useState("");

  const addDebugLog = (_message: string) => {};

  useEffect(() => {
    let cancelled = false;
    let sessionId: string | null = null;
    let ionSFUClient: IonSFUClient | null = null;

    async function init() {
      if (!roomId) return;
      
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
            role: "viewer",
            userAgent: navigator.userAgent,
          }),
        });
        const startJson = await startRes.json();
        sessionId = startJson?.session?.id ?? null;
        
      } catch {}
      
      try {
        // Initialize Ion-SFU client
        
        ionSFUClient = new IonSFUClient();
        
        // Set up track callback
        ionSFUClient.setOnTrack((track: MediaStreamTrack, stream: MediaStream) => {
          
          
          if (videoRef.current) {
            
            
            // Clear any existing content
            videoRef.current.innerHTML = '';
            
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            
            // Add event listeners for debugging
            videoRef.current.addEventListener('loadedmetadata', () => {});
            
            videoRef.current.addEventListener('canplay', () => {});
            
            videoRef.current.addEventListener('playing', () => {});
            
            videoRef.current.addEventListener('error', () => {});
            
            videoRef.current.addEventListener('loadstart', () => {});
            
            videoRef.current.addEventListener('waiting', () => {});
            
            videoRef.current.play().catch(() => {});
            
            
          } else {
            
          }
        });
        
        // Initialize Ion-SFU client
        
        await ionSFUClient.initialize(roomId, 'ws://localhost:7000/ws');
        
        
        if (cancelled) return;

        // Start subscribing to streams
        await ionSFUClient.startSubscribing();
        
        
        setStatus("viewing");
        

        
      } catch (err: any) {
        if (cancelled) return;
        const errorMsg = err?.message ?? String(err);
        setError(errorMsg);
        setStatus("error");
        
      }
    }

    init();
    return () => {
      cancelled = true;
      clientSessionActions.decrementDevices();
      
      // Cleanup Ion-SFU resources
      if (ionSFUClient) {
        ionSFUClient.cleanup();
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
    <div className="relative min-h-screen bg-black">
      {/* Full-screen video */}
      <div className="fixed inset-0 z-0">
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          className="w-full h-full object-cover bg-black" 
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Waiting overlay */}
        {status === "loading" && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 vexo-gradient rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-xl font-semibold text-white mb-2">Connecting to Stream</div>
              <div className="text-sm text-gray-300">Room: {roomId}</div>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header with back button and live indicator */}
      <div className="fixed top-0 left-0 right-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="vexo-live-badge">
              LIVE
            </div>
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm text-gray-300 font-medium">{viewers || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Streamer Info Section */}
      <div className="fixed bottom-20 left-4 right-4 z-10 md:hidden">
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 vexo-gradient rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Krish</h3>
                <p className="text-sm text-purple-300">Streaming Now – Dota2</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              <button className="vexo-button-primary text-sm px-4 py-2">
                Following
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chat Section */}
      <div className="fixed bottom-4 left-4 right-4 z-10 md:hidden">
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Comments</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Live</span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-32 overflow-auto pr-2 mb-4">
            {rtMessages.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">No messages yet</div>
            )}
            {rtMessages.map((m) => (
              <div key={m.id} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{m.sender[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-purple-300">{m.sender}</span>
                    <span className="text-xs text-gray-400">now</span>
                  </div>
                  <p className="text-sm text-white break-words">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form
            className="flex gap-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const text = chatInput.trim();
              if (!text) return;
              sendMessage(text, "You");
              setChatInput("");
            }}
          >
            <input
              className="flex-1 vexo-input text-sm py-2 px-3"
              placeholder="Say something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button className="vexo-button-primary text-sm px-4 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Chat Sidebar */}
      <div className="hidden md:block fixed top-20 right-4 z-10 w-80">
        <div className="vexo-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Live Chat</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Live</span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-auto pr-2 mb-4">
            {rtMessages.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-8">No messages yet</div>
            )}
            {rtMessages.map((m) => (
              <div key={m.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{m.sender[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-purple-300">{m.sender}</span>
                    <span className="text-xs text-gray-400">now</span>
                  </div>
                  <p className="text-sm text-white break-words">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form
            className="flex gap-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const text = chatInput.trim();
              if (!text) return;
              sendMessage(text, "You");
              setChatInput("");
            }}
          >
            <input
              className="flex-1 vexo-input text-sm py-2 px-3"
              placeholder="Say something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button className="vexo-button-primary text-sm px-4 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Streamer Info */}
      <div className="hidden md:block fixed top-20 left-4 z-10 w-80">
        <div className="vexo-card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-16 h-16 vexo-gradient rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">Krish</h3>
              <p className="text-sm text-purple-300">Streaming Now – Dota2</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-300">124.5K viewers</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex-1 vexo-button-secondary text-sm py-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Follow
            </button>
            <button className="flex-1 vexo-button-primary text-sm py-2">
              Subscribe
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="text-red-300 text-sm" role="alert">{error}</div>
            </div>
          )}
        </div>
      </div>

      {/* Debug panel removed for production */}
    </div>
  );
}
