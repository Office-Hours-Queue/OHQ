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
      min:1,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  // We'll add similar configs for production as needed

};
