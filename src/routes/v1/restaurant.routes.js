const express = require('express');
const router = express.Router();

const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  createRestaurantAndDish,
  getMyRestaurants,
  approveRestaurant,
  rejectRestaurant,
  createDish,
  approveDish,
  rejectDish,
  getAllRestaurantsAdmin,
  updateRestaurant,
  deleteRestaurant,
  getPendingDishes,
  getMyNotifications
} = require('../../controllers/restaurant.controller');

const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');
const {
  validateRestaurantBody,
  validateRestaurantWithDishBody,
  validateDishBody,
  validateId
} = require('../../middlewares/restaurantValidators');

// Rutas Públicas
router.get('/', getRestaurants);

// Rutas Administrativas (Declaradas ANTES de /:id para evitar colisiones de rutas)
router.get('/admin/all', requireAuth, requireRole('admin'), getAllRestaurantsAdmin);
router.get('/admin/dishes/pending', requireAuth, requireRole('admin'), getPendingDishes);

// Rutas de Usuario Autenticado con segmento fijo (también ANTES de /:id)
router.get('/mine', requireAuth, getMyRestaurants);
router.get('/notifications/mine', requireAuth, getMyNotifications);
router.post('/with-dish', requireAuth, validateRestaurantWithDishBody, createRestaurantAndDish);

router.patch('/:id/approve', requireAuth, requireRole('admin'), validateId('id'), approveRestaurant);
router.patch('/:id/reject', requireAuth, requireRole('admin'), validateId('id'), rejectRestaurant);
router.patch('/dishes/:dishId/approve', requireAuth, requireRole('admin'), validateId('dishId'), approveDish);
router.patch('/dishes/:dishId/reject', requireAuth, requireRole('admin'), validateId('dishId'), rejectDish);
router.put('/:id', requireAuth, requireRole('admin'), validateId('id'), updateRestaurant);
router.delete('/:id', requireAuth, requireRole('admin'), validateId('id'), deleteRestaurant);

// Rutas de Detalle y Creación
router.get('/:id', validateId('id'), getRestaurantById);
router.post('/', requireAuth, validateRestaurantBody, createRestaurant);
router.post('/:id/dishes', requireAuth, validateId('id'), validateDishBody, createDish);

module.exports = router;