FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install -g http-server

EXPOSE 8080

CMD ["http-server", "-p", "8080"]

# This Dockerfile is for a Node.js application. It uses the official Node.js 18 Alpine image as the base image.