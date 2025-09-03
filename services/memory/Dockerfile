FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY packages/libconfig/package.json ./packages/libconfig/
COPY packages/libcopilot/package.json ./packages/libcopilot/
COPY packages/libformat/package.json ./packages/libformat/
COPY packages/libperf/package.json ./packages/libperf/
COPY packages/libpolicy/package.json ./packages/libpolicy/
COPY packages/libprompt/package.json ./packages/libprompt/
COPY packages/librel/package.json ./packages/librel/
COPY packages/librepl/package.json ./packages/librepl/
COPY packages/libresource/package.json ./packages/libresource/
COPY packages/libservice/package.json ./packages/libservice/
COPY packages/libstorage/package.json ./packages/libstorage/
COPY packages/libtype/package.json ./packages/libtype/
COPY packages/libutil/package.json ./packages/libutil/
COPY packages/libvector/package.json ./packages/libvector/
COPY packages/libweb/package.json ./packages/libweb/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/ ./packages/
COPY proto/ ./proto/
COPY config/ ./config/
COPY services/memory/ ./services/memory/

# Expose service port
EXPOSE 3000

# Start service
CMD ["node", "services/memory/server.js"]
