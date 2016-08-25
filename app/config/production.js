var config = {};

// Get/set these values from the Google APIs console
config.GOOGLE_OAUTH2_CONFIG = {
  clientID: '458287048062-72ov34gb94lep95onf4ret5lalbkpie4.apps.googleusercontent.com',
  clientSecret: 'RpGBRq_ol6BBNLEpAYjYCImk',
  callbackURL: 'https://queue.edwarddryer.com/api/login/success'
};

// Connection to database
config.KNEX = {
  client: 'postgresql',
  connection: 'postgres://queue:supersecret@112_queue_postgres:5432/queue'
};

// Google Spreadsheet backup ID
config.GOOGLE_SHEETS = {
	"id": "1yMXVOOSyNXrZN05CkabjwVIi3eOwpYZN7rMpXvO51_k"
};

module.exports = config;
