FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY services/scope/package.json ./services/scope/
COPY services/scope/ ./services/scope/

RUN npm ci --workspace=@copilot-ld/scope --include-workspace-root

WORKDIR /app/services/scope

EXPOSE 3000
CMD ["npm", "start"]
