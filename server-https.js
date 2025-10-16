const { createServer } = require('https');
const { readFileSync } = require('fs');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3003', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTPS server with self-signed certificate
  const httpsOptions = {
    key: readFileSync('./certs/localhost-key.pem'),
    cert: readFileSync('./certs/localhost.pem'),
  };

  const server = createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `https://${req.headers.host}`);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
    console.log(`> Next.js server running on port ${port}`);
  });
});
