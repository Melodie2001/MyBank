FROM nginx:stable-alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY default.conf /etc/nginx/conf.d/00-default.conf
COPY snippets/ /etc/nginx/snippets/
COPY templates/ /opt/nexo/templates/
COPY docker-entrypoint.sh /usr/local/bin/nexo-proxy-entrypoint

RUN chmod +x /usr/local/bin/nexo-proxy-entrypoint

ENTRYPOINT ["/usr/local/bin/nexo-proxy-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]
