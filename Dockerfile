####### ===== Build stage =====
FROM node:18-alpine AS build

WORKDIR /usr/src/app

###### Копируем package-файлы отдельно (для кеша)
COPY package*.json ./
COPY web-interface/package*.json ./web-interface/

##### Устанавливаем зависимости
RUN npm install --production
RUN cd web-interface && npm install --production

##### Копируем исходники
COPY . .

##### ===== Runtime stage =====
FROM node:18-alpine

WORKDIR /usr/src/app

##### Копируем только результат сборки
COPY --from=build /usr/src/app /usr/src/app

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "web-interface/server.js"]
