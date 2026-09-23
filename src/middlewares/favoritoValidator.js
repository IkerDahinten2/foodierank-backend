const { body, param, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

const validateFavorito = [
  param('id').custom((val) => ObjectId.isValid(val)).withMessage('ID de favorito inválido'),
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