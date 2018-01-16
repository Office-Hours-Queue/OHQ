var config = {};

// Get/set these values from the Google APIs console
config.GOOGLE_OAUTH2_CONFIG = {
  clientID: '458287048062-72ov34gb94lep95onf4ret5lalbkpie4.apps.googleusercontent.com',
  clientSecret: 'RpGBRq_ol6BBNLEpAYjYCImk',
  callbackURL: 'https://queue.onetwelve.xyz/api/login/success'
};

// Connection to database
config.KNEX = {
  client: 'postgresql',
  connection: 'postgres://' + process.env.RDS_USERNAME + ':' + process.env.RDS_PASSWORD +
                '@' + process.env.RDS_HOSTNAME + ':' + process.env.RDS_PORT + '/' + process.env.RDS_DB_NAME
};

// Google Spreadsheet backup ID
config.GOOGLE_SHEETS = {
	"id": "1BLgV7OxRBPf5nEjWjSlGNOYGq6DtsJoj2KC9VqwSa5A"
};

// Superusers who can access super-secret stuff
config.ADMIN_USERS = [
  'aschick@andrew.cmu.edu',
  'edryer@andrew.cmu.edu',
  'fmarsh@andrew.cmu.edu',
  'koz@cmu.edu',
  'tstentz@andrew.cmu.edu',
  'aschick@andrew.cmu.edu',
];

module.exports = config;
