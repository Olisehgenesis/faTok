# Generate self-signed SSL certificate for localhost HTTPS testing

# Create certs directory
mkdir -p certs

# Generate private key
openssl genrsa -out certs/localhost-key.pem 2048

# Generate certificate
openssl req -new -x509 -key certs/localhost-key.pem -out certs/localhost.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "SSL certificates generated in ./certs/"
echo "You can now run: node server-https.js"
echo "Access your app at: https://localhost:3003"
