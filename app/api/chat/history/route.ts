import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId') || '';
  const limitParam = searchParams.get('limit');
  const limit = Math.min(200, Math.max(1, Number(limitParam || 50)));

  if (!roomId) {
    return new Response(JSON.stringify({ error: 'roomId is required' }), { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return new Response(JSON.stringify({
    roomId,
    messages: messages.reverse(),
  }), { headers: { 'Content-Type': 'application/json' } });
}
