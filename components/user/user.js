
module.exports.cleanUser = function(user) { 
  user.auth_method = user.google_id === null ? 'local' : 'google';
  delete user.pw_bcrypt;
  delete user.is_temp_pw;
  delete user.google_id;
  return user;
};
