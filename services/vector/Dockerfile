FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY services/vector/package.json ./services/vector/
COPY services/vector/ ./services/vector/

RUN npm ci --workspace=@copilot-ld/vector --include-workspace-root

WORKDIR /app/services/vector

EXPOSE 3000
CMD ["npm", "start"]
