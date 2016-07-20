var config = {};

// Get/set these values from the Google APIs console
config.GOOGLE_OAUTH2_CONFIG = {
  clientID: 'myclientid.apps.googleusercontent.com',
  clientSecret: 'supersecret',
  callbackURL: 'http://localhost:3000/success'
};

// Connection to database
config.KNEX = {
  client: 'postgresql',
  connection: 'postgres://someuser:somepassword@somehost:381/sometable'
};

module.exports = config;
