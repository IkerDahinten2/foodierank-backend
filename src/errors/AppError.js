// Error de negocio/HTTP controlado por la aplicación
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distingue errores esperados de bugs reales
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = 'No has iniciado sesión o tu token no es válido') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'No tienes permisos para realizar esta acción') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'El recurso solicitado no existe') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  static internal(message = 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}

module.exports = AppError;
