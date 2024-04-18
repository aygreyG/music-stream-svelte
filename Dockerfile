FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate
RUN npm run build && npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY /prisma prisma
COPY package.json .
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT [ "/app/entrypoint.sh" ]