
// Automatically set the configuration file based on the environment
switch (process.env.NODE_ENV) {
  case 'development':
    module.exports = require('./dev');
    break;
  default:
    module.exports = require('./' + process.env.NODE_ENV);
    break;
}
