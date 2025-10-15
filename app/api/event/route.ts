import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

// POST /api/event
// Body: { type: "session_start"|"session_end"|"message", roomId, role?, sender?, text?, userAgent? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, roomId } = body as any;
    if (!type || !roomId) {
      return NextResponse.json({ error: "Missing type or roomId" }, { status: 400 });
    }

    // Ensure room exists
    await prisma.room.upsert({
      where: { id: roomId },
      update: {},
      create: { id: roomId, isLive: type === "session_start" },
    });

    if (type === "session_start") {
      const session = await prisma.session.create({
        data: {
          roomId,
          role: body.role ?? "viewer",
          userAgent: body.userAgent ?? null,
        },
      });
      // If creator starts, mark live
      if (body.role === "creator") {
        await prisma.room.update({ where: { id: roomId }, data: { isLive: true } });
      }
      return NextResponse.json({ ok: true, session });
    }

    if (type === "session_end") {
      const sessionId = body.sessionId as string | undefined;
      if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });
      return NextResponse.json({ ok: true, session });
    }

    if (type === "message") {
      const { sender, text } = body as any;
      if (!sender || !text) return NextResponse.json({ error: "Missing sender or text" }, { status: 400 });
      const message = await prisma.message.create({
        data: { roomId, sender, text },
      });
      return NextResponse.json({ ok: true, message });
    }

    return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// GET /api/event?roomId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "Missing roomId" }, { status: 400 });

  const [room, sessions, messages] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId } }),
    prisma.session.findMany({ where: { roomId }, orderBy: { createdAt: "desc" } }),
    prisma.message.findMany({ where: { roomId }, orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({ room, sessions, messages });
}


