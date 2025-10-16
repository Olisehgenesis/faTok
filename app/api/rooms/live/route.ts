import { prisma } from "@/app/lib/db";

export async function GET() {
  const rooms = await prisma.room.findMany({
    where: { isLive: true },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  return new Response(JSON.stringify({ rooms }), {
    headers: { "Content-Type": "application/json" },
  });
}


