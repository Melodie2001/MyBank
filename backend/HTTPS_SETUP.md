# HTTPS deployment

The public entry points are:

- `https://nexo-finance.duckdns.org` for the user application;
- `https://nexo-finance-admin.duckdns.org` for the administration portal;
- `https://nexo-finance-api.duckdns.org` for the Symfony API.

Only the `proxy` service publishes ports 80 and 443. Application and database
ports are bound to `127.0.0.1` for local diagnostics and SSH tunnels.

## 1. Start the stack in bootstrap mode

From the `backend` directory, create the local runtime configuration and JWT
keys if they do not already exist. Never commit either file:

```bash
cp .env.example .env
# Replace every placeholder in .env, then generate the JWT key pair.
php bin/console lexik:jwt:generate-keypair
```

Then start the stack:

```bash
docker compose up -d --build
```

When a certificate is missing, the proxy exposes only
`/.well-known/acme-challenge/` and returns `503` for application traffic. This
prevents nginx from failing on the first startup without exposing credentials or
JWTs over clear-text HTTP.

## 2. Request certificates

Run one command per domain. Replace the email address before running them:

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  --email you@example.com --agree-tos --no-eff-email \
  --cert-name nexo-finance.duckdns.org \
  -d nexo-finance.duckdns.org

docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  --email you@example.com --agree-tos --no-eff-email \
  --cert-name nexo-finance-admin.duckdns.org \
  -d nexo-finance-admin.duckdns.org

docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  --email you@example.com --agree-tos --no-eff-email \
  --cert-name nexo-finance-api.duckdns.org \
  -d nexo-finance-api.duckdns.org
```

Use `--dry-run` first while troubleshooting. Production validation failures are
rate-limited by Let's Encrypt.

### DuckDNS DNS-01 fallback

If HTTP-01 reports `During secondary validation` DNS timeouts, use the pinned
DuckDNS DNS plugin. It shares `/etc/letsencrypt` with the normal Certbot service,
so nginx paths do not change.

Create the ignored credentials file and protect it:

```bash
cp certbot/duckdns.ini.example certbot/duckdns.ini
chmod 600 certbot/duckdns.ini
```

Replace the placeholder token, then test each failing domain in a separate
Certbot invocation:

```bash
for domain in \
  nexo-finance-admin.duckdns.org \
  nexo-finance-api.duckdns.org
do
  docker compose run --rm certbot-dns certonly --dry-run \
    --non-interactive --agree-tos --email you@example.com \
    --preferred-challenges dns \
    --authenticator dns-duckdns \
    --dns-duckdns-credentials /conf/duckdns.ini \
    --dns-duckdns-propagation-seconds 300 \
    --cert-name "$domain" -d "$domain"
done
```

After both dry runs succeed, repeat the loop without `--dry-run`, then restart
the proxy. Do not commit or print `certbot/duckdns.ini`; the DuckDNS token can
modify every domain in that account.

## 3. Enable HTTPS

Restart the proxy after the certificates have been created. Its entrypoint will
detect each certificate, enable the corresponding TLS virtual host and redirect
normal HTTP traffic to HTTPS:

```bash
docker compose restart proxy
docker compose exec proxy nginx -t
```

## 4. Renew automatically

Test the saved renewal configuration:

```bash
docker compose run --rm certbot renew --dry-run
```

Schedule the repository script once per day on the Docker host, for example with
cron. Invoke it through `sh`, so it does not depend on the Git executable bit:

```cron
23 4 * * * cd /home/USER/MyBank/backend && sh scripts/renew-certificates.sh
```

Certbot state, ACME challenges and logs are stored below `backend/certbot/` and
are excluded from Git because that directory contains private keys.
