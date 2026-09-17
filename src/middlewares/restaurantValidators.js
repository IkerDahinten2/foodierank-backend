const { body, param, query, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

const validateRestaurantBody = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria'),
  body('categoriaId')
    .notEmpty().withMessage('La categoría es obligatoria')
    .custom((val) => ObjectId.isValid(val)).withMessage('El ID de categoría no es válido'),
  body('ubicacion').trim().notEmpty().withMessage('La ubicación es obligatoria'),
  body('imagenUrl').optional().isURL().withMessage('La URL de la imagen no es válida'),
  validateResult
];

// NUEVO: validador del formulario combinado (restaurante + su primer plato)
const validateRestaurantWithDishBody = [
  body('nombre').trim().notEmpty().withMessage('El título del restaurante es obligatorio'),
  body('descripcion').trim().notEmpty().withMessage('La descripción del restaurante es obligatoria'),
  body('categoriaId')
    .notEmpty().withMessage('La categoría es obligatoria')
    .custom((val) => ObjectId.isValid(val)).withMessage('El ID de categoría no es válido'),
  body('ubicacion').trim().notEmpty().withMessage('La ubicación es obligatoria'),
  body('horario').trim().notEmpty().withMessage('El horario es obligatorio'),
  body('imagenUrl')
    .trim().notEmpty().withMessage('La imagen del restaurante es obligatoria')
    .isURL().withMessage('La URL de la imagen del restaurante no es válida'),
  body('platoNombre').trim().notEmpty().withMessage('El nombre del plato es obligatorio'),
  body('platoDescripcion').trim().notEmpty().withMessage('La descripción del plato es obligatoria'),
  body('platoPrecio').isFloat({ min: 0.01 }).withMessage('El precio del plato debe ser un número positivo'),
  body('platoImagenUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('La URL de la imagen del plato no es válida'),
  validateResult
];

const validateDishBody = [
  body('nombre').trim().notEmpty().withMessage('El nombre del plato es obligatorio'),
  body('descripcion').trim().notEmpty().withMessage('La descripción del plato es obligatoria'),
  body('precio')
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser un número positivo'),
  validateResult
];

const validateId = (paramName) => [
  param(paramName).custom((val) => ObjectId.isValid(val)).withMessage(`El ${paramName} no es válido`),
  validateResult
];

module.exports = {
  validateRestaurantBody,
  validateRestaurantWithDishBody,
  validateDishBody,
  validateId
};