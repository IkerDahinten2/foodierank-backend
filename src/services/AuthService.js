const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const RegisterUserDTO = require('../dtos/RegisterUserDTO');
const userRepository = require('../repositories/UserRepository');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_foodierank_2026';

class AuthService {
  async register(body) {
    const dto = new RegisterUserDTO(body);

    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw AppError.conflict('El correo ya se encuentra registrado', 'EMAIL_TAKEN');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const result = await userRepository.insertOne(dto.toPersistence(hashedPassword));

    return { userId: result.insertedId };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const payload = { id: user._id.toString(), email: user.email, rol: user.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return {
      token,
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol }
    };
  }
}

module.exports = new AuthService();
