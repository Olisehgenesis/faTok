"use client";
import { useRouter } from "next/navigation";
import { generateRoomId } from "@/lib/room-utils";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [rooms, setRooms] = useState<{ id: string; title: string | null; createdAt: string }[]>([]);

  useEffect(() => {
    fetch('/api/rooms/live')
      .then(r => r.json())
      .then(data => setRooms(data.rooms || []))
      .catch(() => {});
  }, []);

  function onCreateLive() {
    setIsCreating(true);
    const id = generateRoomId();
    // Mark this user as the creator for this room
    sessionStorage.setItem(`room-creator-${id}`, 'true');
    router.push(`/create/${id}`);
  }

  function onJoinLive() {
    setIsJoining(true);
    const id = prompt("Enter 6-digit room ID to join");
    if (id && id.trim()) {
      router.push(`/view/${id.trim()}`);
    } else {
      setIsJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F12] vexo-grid-bg flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">VexoSocial</h1>
        <button
          onClick={onCreateLive}
          className="vexo-button-primary text-sm px-4 py-2"
        >
          Go Live
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 pb-10">
        {/* Live Rooms */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-gray-300">Live now</h2>
          <button
            onClick={() => router.refresh?.()}
            className="text-xs text-gray-400 hover:text-white"
          >Refresh</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {rooms.length === 0 && (
            <div className="col-span-full text-center text-gray-500 text-sm py-8">
              No live rooms yet
            </div>
          )}
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/view/${r.id}`)}
              className="group overflow-hidden rounded-xl border border-[#26262C] bg-[#141418] hover:bg-[#17171c] transition-colors text-left"
            >
              <div className="aspect-video w-full bg-gradient-to-br from-purple-600/20 to-pink-500/10" />
              <div className="p-3">
                <div className="text-white text-sm font-medium truncate">{r.title || `Room ${r.id}`}</div>
                <div className="text-xs text-gray-400">{r.id}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
