# VexoSocial - MediaSoup Live Streaming App

A Next.js application with MediaSoup for real-time live streaming with 6-digit room IDs.

## Features

- ✅ 6-digit room ID generation
- ✅ MediaSoup WebRTC live streaming
- ✅ Real-time chat
- ✅ Session tracking in database
- ✅ Creator/Viewer roles
- ✅ Mobile-responsive UI

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up database:**
   ```bash
   npm run db:migrate
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

This will start both:
- **Next.js app** at `http://localhost:3003`
- **MediaSoup server** at `http://localhost:3004`

## How it works

1. **Create Live**: Generates a 6-digit room ID and marks you as the creator
2. **Join Live**: Enter a 6-digit room ID to join as a viewer
3. **Broadcasting**: Creator's camera stream is broadcast via MediaSoup
4. **Viewing**: Viewers receive the live stream in real-time
5. **Chat**: Real-time chat messages are stored in the database

## Architecture

- **Frontend**: Next.js with React
- **Backend**: Custom Node.js server with Socket.IO
- **WebRTC**: MediaSoup for real-time streaming
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.IO for WebSocket communication

## Environment Variables

Create a `.env` file:
```
DATABASE_URL="file:./dev.db"
# Optional: Set if behind NAT/firewall
# MEDIASOUP_ANNOUNCED_IP="your-public-ip"
```

## Troubleshooting

- **Camera not working**: Ensure HTTPS or localhost
- **Stream not showing**: Check browser console for errors
- **Connection issues**: Verify Socket.IO connection in Network tab

## Production Deployment

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Ensure proper SSL certificates for WebRTC
4. Configure firewall for MediaSoup ports (10000-10100)