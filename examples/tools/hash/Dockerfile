FROM copilot-ld/base:latest AS base
FROM base AS hash
COPY tools/hash/ ./tools/hash/
WORKDIR /app
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=$GITHUB_TOKEN
RUN npm ci
WORKDIR /app/tools/hash
EXPOSE 3000
CMD ["npm", "start"]
