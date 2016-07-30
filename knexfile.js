// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host:     '172.17.0.2',
      port:     '5432',
      database: 'queue',
      user:     'queue',
      password: 'supersecret'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  // We'll add similar configs for production as needed

};
