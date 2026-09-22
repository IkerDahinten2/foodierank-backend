const AppError = require('../errors/AppError');

// Traduce errores nativos de MongoDB/driver a un AppError con mensaje amigable.

function mapKnownError(err) {
  // Llave duplicada (índice único: email, nombre de categoría, etc.)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'valor';
    const friendlyField = { email: 'correo electrónico', nombre: 'nombre' }[field] || field;
    return AppError.conflict(`Ya existe un registro con ese ${friendlyField}`, 'DUPLICATE_KEY');
  }

  // Documento rechazado por la validación $jsonSchema de la colección
  if (err.codeName === 'DocumentValidationFailure' || err.code === 121) {
    return AppError.badRequest(
      'Los datos enviados no cumplen con el formato requerido por la base de datos',
      'SCHEMA_VALIDATION'
    );
  }

  // ObjectId / BSON con formato inválido que no fue detectado antes por express-validator
  if (err.name === 'BSONError' || err.name === 'BSONTypeError') {
    return AppError.badRequest('Uno de los identificadores enviados no tiene un formato válido', 'INVALID_ID');
  }

  // Problemas de conectividad con MongoDB durante una operación (no al arrancar)
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    return AppError.internal(
      'No fue posible comunicarse con la base de datos en este momento. Intenta de nuevo en unos minutos.'
    );
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof AppError)) {
    error = mapKnownError(err) || AppError.internal();
    // El detalle real solo se registra en el servidor, nunca se envía al cliente
    console.error(`[Error no controlado] ${req.method} ${req.originalUrl} ->`, err);
  } else {
    console.error(`[AppError ${error.statusCode}] ${req.method} ${req.originalUrl} -> ${error.code}: ${error.message}`);
  }

  res.status(error.statusCode).json({
    ok: false,
    code: error.code,
    message: error.message
  });
}

module.exports = errorHandler;
