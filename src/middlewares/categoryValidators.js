const { body, param, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');

// Validador para crear y actualizar categorías
const validateCategoryBody = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre de la categoría es obligatorio')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La descripción no puede superar los 200 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }
    next();
  }
];

// Validador para endpoints que reciben :id en la URL
const validateCategoryId = [
  param('id')
    .custom((value) => {
      if (!ObjectId.isValid(value)) {
        throw new Error('El ID de categoría proporcionado no es válido');
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateCategoryBody, validateCategoryId };