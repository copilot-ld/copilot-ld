# Unified gateway container with nginx for both ingress and egress
FROM nginx:alpine

# Copy nginx configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf
COPY proxy_params /etc/nginx/proxy_params

# Create necessary directories
RUN mkdir -p /var/log/nginx /etc/nginx/conf.d

# Expose ports: 80/443 for ingress, 3128 for egress proxy
EXPOSE 80 443 3128

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
