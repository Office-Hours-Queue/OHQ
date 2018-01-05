var config = {};

// Get/set these values from the Google APIs console
config.GOOGLE_OAUTH2_CONFIG = {
  clientID: '458287048062-72ov34gb94lep95onf4ret5lalbkpie4.apps.googleusercontent.com',
  clientSecret: 'RpGBRq_ol6BBNLEpAYjYCImk',
  callbackURL: 'http://localhost:3000/api/login/success'
};

// Connection to database
config.KNEX = {
  client: 'postgresql',
  connection: 'postgres://queue:supersecret@127.0.0.1:5432/queue'
};

// Google Spreadsheet backup ID
config.GOOGLE_SHEETS = {
	"id": "15_vlyPc1LJ8J2i6a_zEK1D3cbjnIyxN9XcY14RcpclQ"
};

// Superusers who can access super-secret stuff
config.ADMIN_USERS = [
  'kevinzhe',
  'edryer',
  'fmarsh',
  'aschick'
];

module.exports = config;
