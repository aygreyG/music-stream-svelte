FROM node:23-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm exec prisma generate
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/src/generated/prisma-client /app/src/generated/prisma-client
COPY --from=build /app/build /app/build
COPY /prisma prisma
COPY package.json .
COPY start.sh start.sh
RUN chmod +x start.sh
EXPOSE 3000
ENV NODE_ENV=production
ARG APP_VERSION=unknown
ENV APP_VERSION=${APP_VERSION}
VOLUME [ "/app/db" ]
ENTRYPOINT [ "/app/start.sh" ]