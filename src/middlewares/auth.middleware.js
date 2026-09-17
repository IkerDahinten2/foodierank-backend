const passport = require('passport');

// Verifica que el JWT sea válido
const requireAuth = passport.authenticate('jwt', { session: false });

// Verifica si el usuario tiene el rol necesario
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.rol !== role) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado: se requiere rol de ${role}`
      });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };