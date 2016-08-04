var config = {};

// Get/set these values from the Google APIs console
config.GOOGLE_OAUTH2_CONFIG = {
  clientID: '458287048062-72ov34gb94lep95onf4ret5lalbkpie4.apps.googleusercontent.com',
  clientSecret: 'RpGBRq_ol6BBNLEpAYjYCImk',
  callbackURL: 'http://localhost:3000/login/success'
};

// Connection to database
config.KNEX = {
  client: 'postgresql',
  connection: 'postgres://queue:supersecret@127.0.0.1:5432/queue'
};

module.exports = config;
