"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type ChatItem = {
  id: string;
  roomId: string;
  sender: string;
  text: string;
  createdAt: string;
};

export function useRealtimeChat(roomId: string, options?: { name?: string }) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [viewers, setViewers] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const url = useMemo(() => {
    return process.env.NEXT_PUBLIC_CHAT_URL || "http://localhost:7002";
  }, []);

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;
    const socket = io(url, { transports: ["websocket"], autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.emit("join", { roomId, name: options?.name });

    socket.on("presence:update", (p: { roomId: string; viewers: number }) => {
      if (p.roomId === roomId) setViewers(p.viewers);
    });

    socket.on("chat:message", (m: ChatItem) => {
      if (m.roomId !== roomId) return;
      setMessages((prev) => [...prev, m]);
    });

    // Fetch history
    fetch(`/api/chat/history?roomId=${encodeURIComponent(roomId)}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.messages)) setMessages(data.messages);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      socket.emit("leave", { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, url, options?.name]);

  function sendMessage(text: string, sender = "You") {
    const payload = { roomId, sender, text };
    // optimistic update
    const optimistic: ChatItem = {
      id: `tmp_${Date.now()}`,
      roomId,
      sender,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    socketRef.current?.emit("chat:message", payload);
  }

  return { messages, viewers, connected, sendMessage };
}
