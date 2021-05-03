const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '12345',
    database : 'nms'
  }
});




const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport) {
  const authenticateUser = (email, password, done) => {
    knex('users').where('email',email).then(async user=>{
      if (user.length == 0) {
        return done(null, false, { message: "No user with that email" });
      }
      try {
        if (await bcrypt.compare(password, user[0].password)) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Password incorrect" });
        }
      } catch (e) {
        return done(e);
      }
    })
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));
  passport.serializeUser((user, done) => done(null, user[0].id));
  passport.deserializeUser((id, done) => {
    knex('users').where('id',id).then(data=>{
      return done(null,data[0])
    })
  });
}

module.exports = initialize;
