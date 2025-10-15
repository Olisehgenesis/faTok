"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CreateRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = useMemo(() => params?.roomId ?? "", [params]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    // In a real app, you would call your backend to create a room on mediasoup server here.
    // For now, just simulate success and navigate to join page.
  }, [roomId]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create room</h1>
      <div className="mb-4">
        <span className="font-mono rounded px-2 py-1 bg-black/5 dark:bg-white/10">
          Room ID: {roomId || "(missing)"}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          className="rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 disabled:opacity-50"
          onClick={() => router.push(`/join/${roomId}`)}
          disabled={!roomId}
        >
          Continue to join
        </button>
        {error && (
          <span className="text-red-600 text-sm" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}


