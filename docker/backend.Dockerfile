FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci

COPY backend backend
RUN npm --workspace backend run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci --omit=dev --workspace backend

COPY --from=build /app/backend/dist backend/dist

USER node
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
