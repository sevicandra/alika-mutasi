FROM node:lts-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install pm2 -g
EXPOSE 3000
CMD ["pm2-runtime", "ecosystem.config.js"]