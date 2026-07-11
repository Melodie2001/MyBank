#!/bin/sh
set -eu

OUTPUT=/etc/nginx/conf.d/10-sites.conf

render_site() {
    domain="$1"
    upstream="$2"
    certificate="/etc/letsencrypt/live/${domain}/fullchain.pem"
    private_key="/etc/letsencrypt/live/${domain}/privkey.pem"

    if [ -s "$certificate" ] && [ -s "$private_key" ]; then
        template=/opt/nexo/templates/site-https.conf.template
        echo "Enabling HTTPS for ${domain}"
    else
        template=/opt/nexo/templates/site-http.conf.template
        echo "Certificate not found for ${domain}; keeping HTTP enabled for ACME bootstrap"
    fi

    sed \
        -e "s|__DOMAIN__|${domain}|g" \
        -e "s|__UPSTREAM__|${upstream}|g" \
        "$template" >> "$OUTPUT"
    printf '\n' >> "$OUTPUT"
}

: > "$OUTPUT"
render_site "${USER_DOMAIN:-nexo-finance.duckdns.org}" "frontend:80"
render_site "${ADMIN_DOMAIN:-nexo-finance-admin.duckdns.org}" "frontend-admin:80"
render_site "${API_DOMAIN:-nexo-finance-api.duckdns.org}" "backend:8000"

exec /docker-entrypoint.sh "$@"
