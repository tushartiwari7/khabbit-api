FROM node:22 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
FROM node:22 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:22 AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
FROM node:22
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
