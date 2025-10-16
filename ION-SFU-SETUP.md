# Ion-SFU Setup for VexoSocial

## Quick Start

### 1. Install Ion-SFU Server

```bash
# Clone Ion-SFU
git clone https://github.com/pion/ion-sfu.git
cd ion-sfu

# Build the server
go build ./cmd/signal/json-rpc/main.go

# Run the server
./main -c config.toml
```

### 2. Default Configuration

The server will run on:
- **WebSocket**: `ws://localhost:7000/ws`
- **HTTP**: `http://localhost:7000`

### 3. Start VexoSocial

```bash
# In the VexoSocial directory
pnpm dev
```

### 4. Test the Setup

1. Open `http://localhost:3003/test`
2. Create a room
3. Start broadcasting (will use Ion-SFU)
4. Start viewing (will connect to Ion-SFU)

## Configuration

The Ion-SFU server uses `config.toml` for configuration. Key settings:

```toml
[sfu]
# WebRTC configuration
[sfu.webrtc]
ice_servers = ["stun:stun.l.google.com:19302"]

# Signaling server
[signal]
protocol = "jsonrpc"
addr = ":7000"
```

## Troubleshooting

### WSL Issues
If you're using WSL, make sure:
1. Windows Firewall allows the ports
2. Ion-SFU server is accessible from WSL
3. WebSocket connections work properly

### Port Conflicts
If port 7000 is in use, change it in the config:
```toml
[signal]
addr = ":7001"  # Use different port
```

Then update the client connection in `app/view/[roomId]/page.tsx`:
```typescript
await ionSFUClient.initialize(roomId, 'ws://localhost:7001/ws');
```

## Benefits of Ion-SFU over MediaSoup

- ✅ **Simpler setup** - No complex transport management
- ✅ **Better WSL support** - Fewer networking issues
- ✅ **Automatic scaling** - Built-in SFU capabilities
- ✅ **JSON-RPC signaling** - More reliable than Socket.IO
- ✅ **Go-based server** - Better performance and stability
