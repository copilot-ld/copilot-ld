FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/tool/package.json ./services/tool/

# Install dependencies
RUN npm ci --production

# Copy source code
COPY packages ./packages
COPY services/tool ./services/tool

# Start the service
WORKDIR /app/services/tool
CMD ["node", "index.js"]