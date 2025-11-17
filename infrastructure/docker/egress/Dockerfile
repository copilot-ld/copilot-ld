FROM ubuntu/squid:latest

# Copy custom configuration
COPY squid.conf /etc/squid/squid.conf

# Ensure log directory exists with correct permissions
RUN mkdir -p /var/log/squid && \
    chown -R proxy:proxy /var/log/squid

# Expose proxy port
EXPOSE 3128

# Start squid in foreground mode
CMD ["squid", "-N", "-d", "1"]
