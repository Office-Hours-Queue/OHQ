knex migrate:latest
knex seed:run
NODE_ENV=production ./bin/www
