FROM node:20-alpine

RUN mkdir -p /frontend

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY ./ ./

CMD [ "npm", "run", "dev" ]

EXPOSE 5173