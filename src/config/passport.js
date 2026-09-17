const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { ObjectId } = require('mongodb');
const { getDB } = require('./database');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'secreto_super_seguro_foodierank_2026'
};

passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      const db = getDB();
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(jwtPayload.id) },
        { projection: { password: 0 } } // Excluimos la contraseña por seguridad
      );

      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = passport;