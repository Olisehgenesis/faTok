"use client";
import { useRouter } from "next/navigation";
import { generateRoomId } from "@/lib/room-utils";

export default function Home() {
  const router = useRouter();

  function onCreateLive() {
    const id = generateRoomId();
    // Mark this user as the creator for this room
    sessionStorage.setItem(`room-creator-${id}`, 'true');
    router.push(`/create/${id}`);
  }

  function onJoinLive() {
    const id = prompt("Enter 6-digit room ID to join");
    if (id && id.trim()) {
      router.push(`/join/${id.trim()}`);
    }
  }
  return (
    <div className="min-h-screen p-8 sm:p-20 grid place-items-center">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold">FarLive</h1>
        <p className="opacity-80 max-w-xl">
          Start a new live session or join an existing one using a room ID.
        </p>
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-foreground text-background hover:opacity-90 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            onClick={onCreateLive}
          >
            Create live
          </button>
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            onClick={onJoinLive}
          >
            Join live
          </button>
        </div>
      </main>
    </div>
  );
}
