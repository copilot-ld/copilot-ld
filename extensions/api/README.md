# Copilot-LD MS API Extension

Copilot-LD is an intelligent agent leveraging GitHub Copilot, linked data and
retrieval-augmented generation.

This is an AI extension to the Copilot-LD platform using

## 🚀 Setup

### 1. Configuration

Set up environment variables and service configuration:

```sh
cp .env{.example,}
```

### 2. Install dependencies

```sh
npm install
```

### 3. Start services

#### Local Development Environment

Start the service:

```sh
npm start
```

Expose the local service publicly:

```sh
ngrok http 3979
```

Access the services:

- **Web Extension**: `http://localhost:3979/web`

## 👨‍💻 Development

### Testing

Run unit tests:

```sh
npm test
```
