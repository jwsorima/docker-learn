FROM node:20-alpine

RUN mkdir -p /backend

WORKDIR /backend

COPY package*.json ./

RUN npm install

COPY ./ ./

CMD [ "npm", "run", "dev" ]

EXPOSE 3000