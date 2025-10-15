"use client";

import { create } from "react-use-subscription";
import { useSyncExternalStore } from "react";

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  at: number;
};

class ClientSessionStore {
  private deviceCount = 0;
  private chatMessages: ChatMessage[] = [];
  private listeners = new Set<() => void>();
  private cachedSnapshot = {
    deviceCount: 0,
    chatMessages: [] as ChatMessage[],
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  snapshot = () => this.cachedSnapshot;

  private emit() {
    // Update cached snapshot
    this.cachedSnapshot = {
      deviceCount: this.deviceCount,
      chatMessages: [...this.chatMessages],
    };
    for (const l of this.listeners) l();
  }

  incrementDevices() {
    this.deviceCount += 1;
    this.emit();
  }

  decrementDevices() {
    this.deviceCount = Math.max(0, this.deviceCount - 1);
    this.emit();
  }

  appendMessage(message: Omit<ChatMessage, "id" | "at">) {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
      ...message,
    };
    this.chatMessages = [...this.chatMessages, msg];
    this.emit();
  }
}

const store = new ClientSessionStore();

export function useClientSession() {
  return useSyncExternalStore(
    store.subscribe, 
    store.snapshot, 
    () => store.cachedSnapshot // getServerSnapshot - return cached version
  );
}

export const clientSessionActions = {
  incrementDevices: () => store.incrementDevices(),
  decrementDevices: () => store.decrementDevices(),
  appendMessage: (sender: string, text: string) =>
    store.appendMessage({ sender, text }),
};


