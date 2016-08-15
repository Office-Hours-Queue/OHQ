FROM node:argon
RUN mkdir /app
COPY . /app 
WORKDIR /app
ENV NODE_ENV=production
RUN npm install
RUN npm install -g knex
CMD ./bin/www


