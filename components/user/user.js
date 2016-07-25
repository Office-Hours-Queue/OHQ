
module.exports.cleanUser = function(user) { 
  delete user.pw_bcrypt;
  delete user.is_temp_pw;
  delete user.google_id;
  return user;
};
