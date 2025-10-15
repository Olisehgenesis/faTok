"use client";

import { useClientSession } from "../store/clientSession";

export default function Header() {
  const { deviceCount } = useClientSession();
  return (
    <header className="w-full border-b border-black/[.08] dark:border-white/[.145]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">FarLive</div>
        <div className="flex items-center gap-3">
          <div className="text-sm opacity-80">Devices: {deviceCount}</div>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
            aria-label="Persona"
            title="You"
          />
        </div>
      </div>
    </header>
  );
}


