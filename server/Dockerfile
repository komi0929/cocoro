FROM node:20-slim
WORKDIR /app
COPY server/package.json ./
RUN npm install --production
COPY server/index.ts ./index.ts
RUN npx tsc --target es2020 --module node16 --moduleResolution node16 --esModuleInterop true --outDir dist index.ts || true
EXPOSE 3001
CMD ["node", "--experimental-specifier-resolution=node", "--loader", "tsx/esm", "index.ts"]
