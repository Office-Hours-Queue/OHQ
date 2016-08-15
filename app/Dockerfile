FROM node:argon
RUN mkdir /app
COPY . /app 
WORKDIR /app
RUN npm install
RUN npm install -g knex
CMD sh start_prod.sh
