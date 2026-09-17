const express = require('express');
const router = express.Router();
const {
  createReview,
  voteReview,
  getRestaurantReviews,
  deleteReview,
  getAllReviewsAdmin
} = require('../../controllers/review.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');
const {
  validateCreateReview,
  validateVote,
  validateReviewId
} = require('../../middlewares/reviewValidators');

// Rutas Públicas
router.get('/restaurant/:id', getRestaurantReviews);

// Rutas Administrativas (Declaradas ANTES de parámetros dinámicos para evitar colisiones)
router.get('/admin/all', requireAuth, requireRole('admin'), getAllReviewsAdmin);

// Rutas de Usuario Autenticado
router.post('/', requireAuth, validateCreateReview, createReview);
router.post('/:id/vote', requireAuth, validateVote, voteReview);
router.delete('/:id', requireAuth, validateReviewId, deleteReview);

module.exports = router;