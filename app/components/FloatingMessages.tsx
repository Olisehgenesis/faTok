"use client";

import { useEffect, useState } from "react";
import { useClientSession } from "../store/clientSession";

type FloatingMessage = {
  id: string;
  text: string;
  sender: string;
  startTime: number;
};

export default function FloatingMessages() {
  const { chatMessages } = useClientSession();
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);

  useEffect(() => {
    if (chatMessages.length === 0) return;
    
    const latestMessage = chatMessages[chatMessages.length - 1];
    const newFloatingMessage: FloatingMessage = {
      id: latestMessage.id,
      text: latestMessage.text,
      sender: latestMessage.sender,
      startTime: Date.now(),
    };

    setFloatingMessages(prev => [...prev, newFloatingMessage]);

    // Remove message after animation completes (4 seconds)
    const timer = setTimeout(() => {
      setFloatingMessages(prev => prev.filter(msg => msg.id !== newFloatingMessage.id));
    }, 4000);

    return () => clearTimeout(timer);
  }, [chatMessages]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {floatingMessages.map((message, index) => (
        <div
          key={message.id}
          className="absolute animate-slide-up"
          style={{
            right: "16px",
            bottom: "-100px",
            animationDelay: "0ms",
            animationDuration: "4s",
            animationFillMode: "forwards",
            zIndex: 1000 - index,
          }}
        >
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm max-w-xs backdrop-blur-sm shadow-lg">
            <span className="font-semibold text-blue-300">{message.sender}:</span>{" "}
            <span>{message.text}</span>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slide-up {
          0% {
            bottom: -100px;
            opacity: 1;
          }
          60% {
            opacity: 1;
          }
          100% {
            bottom: 40%;
            opacity: 0;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
