const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

// Registrar nuevo usuario
async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;
    const db = getDB();
    const usersCollection = db.collection('users');

    // 1. Validar que el email no esté repetido
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'El correo ya se encuentra registrado' });
    }

    // 2. Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Crear el documento. El registro público SIEMPRE crea usuarios con rol 'usuario'.
    // No se acepta un rol enviado desde el cliente para evitar que alguien se autoasigne como admin.
    const newUser = {
      nombre,
      email,
      password: hashedPassword,
      rol: 'usuario',
      fechaCreacion: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      ok: true,
      message: 'Usuario registrado exitosamente',
      userId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error en el servidor', error: error.message });
  }
}

// Iniciar sesión
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Comprobar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Crear el JWT
    const payload = { id: user._id.toString(), email: user.email, rol: user.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto_super_seguro_foodierank_2026', {
      expiresIn: '8h'
    });

    res.json({
      ok: true,
      token: `Bearer ${token}`,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al iniciar sesión', error: error.message });
  }
}

// Perfil del usuario autenticado (prueba de token)
async function getProfile(req, res) {
  res.json({
    ok: true,
    user: req.user
  });
}

module.exports = { register, login, getProfile };