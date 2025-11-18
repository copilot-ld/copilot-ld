# Unified gateway container with nginx (ingress) and squid (egress)
FROM ubuntu:22.04

# Install nginx, squid, and supervisor
RUN apt-get update && \
    apt-get install -y nginx squid supervisor && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy nginx configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf
COPY proxy_params /etc/nginx/proxy_params

# Copy squid configuration
COPY squid.conf /etc/squid/squid.conf

# Copy supervisor configuration to manage both services
COPY supervisord.conf /etc/supervisord.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/log/nginx /var/log/squid /var/cache/squid /var/run/squid /etc/nginx/conf.d && \
    chown -R proxy:proxy /var/log/squid /var/cache/squid /var/run/squid && \
    squid -z

# Expose ports
EXPOSE 80 443 3128

# Start supervisor to manage both nginx and squid
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
