// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host:     'localhost',
      port:     '5432',
      database: 'queue',
      user:     'queue',
      password: 'supersecret'
    },
    pool: {
      min: 1,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds/dev'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.RDS_HOSTNAME,
      port: process.env.RDS_PORT,
      database: process.env.RDS_DB_NAME,
      user:   process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
    },
    pool: {
      min: 1,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds/prod'
    }
  },


};
