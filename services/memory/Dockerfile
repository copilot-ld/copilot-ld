FROM node:22-alpine

COPY services/memory/ /app/

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=$GITHUB_TOKEN

WORKDIR /app/
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "start"]