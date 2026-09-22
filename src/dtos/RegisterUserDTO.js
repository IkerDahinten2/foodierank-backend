// DTO de entrada para el registro de usuarios
class RegisterUserDTO {
  constructor({ nombre, email, password }) {
    this.nombre = (nombre || '').trim();
    this.email = (email || '').trim().toLowerCase();
    this.password = password;
  }

  toPersistence(hashedPassword) {
    return {
      nombre: this.nombre,
      email: this.email,
      password: hashedPassword,
      rol: 'usuario',
      fechaCreacion: new Date()
    };
  }
}

module.exports = RegisterUserDTO;
