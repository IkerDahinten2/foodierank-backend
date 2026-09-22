const catchAsync = require('../utils/catchAsync');
const authService = require('../services/AuthService');

// Antes: bcrypt, jwt y acceso a Mongo directo aquí mismo, con try/catch
// devolviendo error.message crudo. Ahora el controller solo traduce
// HTTP <-> Service; toda la lógica vive en AuthService.

const register = catchAsync(async (req, res) => {
  const { userId } = await authService.register(req.body);
  res.status(201).json({ ok: true, message: 'Usuario registrado exitosamente', userId });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login(email, password);
  res.json({ ok: true, token, user });
});

const getProfile = catchAsync(async (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = { register, login, getProfile };
