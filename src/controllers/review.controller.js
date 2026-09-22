const catchAsync = require('../utils/catchAsync');
const reviewService = require('../services/ReviewService');

const createReview = catchAsync(async (req, res) => {
  const data = await reviewService.create(req.body, req.user._id);
  res.status(201).json({ ok: true, message: 'Reseña registrada y ranking actualizado exitosamente', data });
});

const voteReview = catchAsync(async (req, res) => {
  await reviewService.vote(req.params.id, req.body.tipo, req.user._id);
  res.json({ ok: true, message: 'Voto registrado correctamente' });
});

const getRestaurantReviews = catchAsync(async (req, res) => {
  const data = await reviewService.listByRestaurant(req.params.id);
  res.json({ ok: true, data });
});

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.delete(req.params.id, req.user);
  res.json({ ok: true, message: 'Reseña eliminada y ranking actualizado' });
});

const getAllReviewsAdmin = catchAsync(async (req, res) => {
  const data = await reviewService.listAllAdmin();
  res.json({ ok: true, data });
});

module.exports = { createReview, voteReview, getRestaurantReviews, deleteReview, getAllReviewsAdmin };
