FROM node:22-alpine AS builder

WORKDIR /app/
COPY package*.json ./
COPY . ./

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install --omit=dev --omit=optional

RUN mkdir -p generated

FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app/
COPY --from=builder /app ./

EXPOSE 3000

CMD ["./node_modules/.bin/download", "--", "/nodejs/bin/node", "server.js"]
