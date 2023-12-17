FROM node:20-bullseye-slim AS builder
WORKDIR /app
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM gcr.io/distroless/nodejs20-debian11
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "build" ]