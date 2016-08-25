/** 
 * Note, the sheet must be shared with 112queue@gmail.com. 
 * If you want to change the sheet, edit sheet_id.
 * Based off of https://developers.google.com/sheets/quickstart/nodejs
 */
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var debug = require('debug')('app:gsheets');
var path = require('path');
var config = require('../../config');

//Information needed for google apis
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = path.join(__dirname, '../../credentials/');
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';
var CREDENTIALS = undefined;
var sheets = google.sheets('v4');
var sheet_id = config.GOOGLE_SHEETS.id; 

// Load client secrets from a local file.
var cred_path = path.join(__dirname, '../../credentials/client_secret.json');
fs.readFile(cred_path, function processClientSecrets(err, content) {
  if (err) {
    debug('Error loading client secret file: ' + err);
    return;
  }
  CREDENTIALS = JSON.parse(content);
});

/**
 * Save student position to google sheet 
 */
function googleSavePosition(andrew_id) {
  //Question info
  var date = new Date();
  var payload = [andrew_id,date.toString()];

  //API info
  var credentials = CREDENTIALS;
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client,payload);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      add_question(oauth2Client,payload);
    }
  });
}

/**
 * Add a question to the spreadsheet given auth
 */
function add_question(auth,payload) {
   sheets.spreadsheets.values.append({
     auth: auth,
     spreadsheetId: sheet_id,
     range: "Sheet1!A1:E1",
     valueInputOption: "RAW",
     insertDataOption: "INSERT_ROWS",
     resource: {
      range:"Sheet1!A1:E1",
      majorDimension: "ROWS",
      values: [payload]
     }
   },function(err, response) {
      if (err) {
        debug(err)
        return;
      }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, payload) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  debug('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        debug('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      add_question(oauth2Client,payload);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  debug('Token stored to ' + TOKEN_PATH);
}


module.exports.googleSavePosition = googleSavePosition;
