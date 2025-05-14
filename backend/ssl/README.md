# SSL Certificates Setup

This directory should contain your SSL certificates for HTTPS. You need two files:

1. `private.key` - Your private key
2. `certificate.crt` - Your SSL certificate

## Generating Self-Signed Certificates (for development)

You can generate self-signed certificates using OpenSSL:

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate signing request (CSR)
openssl req -new -key private.key -out certificate.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in certificate.csr -signkey private.key -out certificate.crt
```

## Production Certificates

For production, you should use proper SSL certificates from a trusted Certificate Authority (CA) like Let's Encrypt.

1. Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot
```

2. Generate certificates:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Copy the generated certificates to this directory:
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ../ssl/private.key
sudo cp /etc/letsencrypt/live/yourdomain.com/cert.pem ../ssl/certificate.crt
```

## Security Notes

1. Never commit SSL certificates to version control
2. Keep your private key secure
3. Regularly renew your certificates
4. Use strong encryption (2048 bits or higher)
5. Consider using environment variables for certificate paths in production 