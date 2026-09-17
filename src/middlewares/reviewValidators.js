const { body, param, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

const validateCreateReview = [
  body('restauranteId')
    .notEmpty().withMessage('El ID del restaurante es obligatorio')
    .custom((val) => ObjectId.isValid(val)).withMessage('ID de restaurante inválido'),
  body('calificacion')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser un entero entre 1 y 5'),
  body('comentario')
    .trim()
    .notEmpty().withMessage('El comentario no puede estar vacío')
    .isLength({ max: 500 }).withMessage('El comentario no puede exceder 500 caracteres'),
  validateResult
];

const validateVote = [
  param('id').custom((val) => ObjectId.isValid(val)).withMessage('ID de reseña inválido'),
  body('tipo')
    .isIn(['like', 'dislike']).withMessage("El tipo de voto debe ser 'like' o 'dislike'"),
  validateResult
];

const validateReviewId = [
  param('id').custom((val) => ObjectId.isValid(val)).withMessage('ID de reseña inválido'),
  validateResult
];

module.exports = {
  validateCreateReview,
  validateVote,
  validateReviewId
};