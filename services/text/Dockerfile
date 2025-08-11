FROM node:22-alpine

WORKDIR /app

# Copy package.json and workspace structure
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY services/ ./services/
COPY extensions/ ./extensions/
COPY tools/ ./tools/
COPY proto/ ./proto/

# Install all dependencies for the entire workspace
RUN npm ci

WORKDIR /app/services/text

EXPOSE 3000
CMD ["npm", "start"]
