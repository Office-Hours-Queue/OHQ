var config = {};

// Get/set these values from the Google APIs console
config.GOOGLE_OAUTH2_CONFIG = {
  clientID: 'myclientid.apps.googleusercontent.com',
  clientSecret: 'supersecret',
  callbackURL: 'http://localhost:3000/success'
};

module.exports = config;
