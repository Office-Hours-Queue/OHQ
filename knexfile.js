// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host:     '127.0.0.1',
      port:     '5432',
      database: 'queue',
      user:     'queue',
      password: 'supersecret'
    },
    pool: {
      min:1,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  // We'll add similar configs for production as needed

};
