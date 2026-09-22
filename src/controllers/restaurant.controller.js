const catchAsync = require('../utils/catchAsync');
const restaurantService = require('../services/RestaurantService');

const getRestaurants = catchAsync(async (req, res) => {
  const data = await restaurantService.listApproved(req.query.categoriaId);
  res.json({ ok: true, data });
});

const getRestaurantById = catchAsync(async (req, res) => {
  const data = await restaurantService.getByIdWithDishes(req.params.id);
  res.json({ ok: true, data });
});

const createRestaurant = catchAsync(async (req, res) => {
  const { estado, data } = await restaurantService.create(req.body, req.user);
  res.status(201).json({
    ok: true,
    message: estado === 'aprobado' ? 'Restaurante creado y aprobado' : 'Restaurante registrado, pendiente de moderación por un administrador',
    data
  });
});

const createRestaurantAndDish = catchAsync(async (req, res) => {
  const resultado = await restaurantService.createWithDish(req.body, req.user);
  res.status(201).json({
    ok: true,
    message: resultado.estado === 'aprobado' ? 'Restaurante y plato creados y aprobados' : 'Restaurante y plato enviados para aprobación del administrador',
    data: { restaurante: resultado.restaurante, plato: resultado.plato }
  });
});

const getMyRestaurants = catchAsync(async (req, res) => {
  const data = await restaurantService.getMine(req.user._id);
  res.json({ ok: true, data });
});

const approveRestaurant = catchAsync(async (req, res) => {
  await restaurantService.approve(req.params.id);
  res.json({ ok: true, message: 'Restaurante aprobado con éxito' });
});

const rejectRestaurant = catchAsync(async (req, res) => {
  await restaurantService.reject(req.params.id);
  res.json({ ok: true, message: 'Restaurante rechazado' });
});

const createDish = catchAsync(async (req, res) => {
  const { estado, data } = await restaurantService.createDish(req.params.id, req.body, req.user);
  res.status(201).json({
    ok: true,
    message: estado === 'aprobado' ? 'Plato creado y aprobado' : 'Plato enviado para aprobación',
    data
  });
});

const approveDish = catchAsync(async (req, res) => {
  await restaurantService.approveDish(req.params.dishId);
  res.json({ ok: true, message: 'Plato aprobado con éxito' });
});

const rejectDish = catchAsync(async (req, res) => {
  await restaurantService.rejectDish(req.params.dishId);
  res.json({ ok: true, message: 'Plato rechazado' });
});

const getAllRestaurantsAdmin = catchAsync(async (req, res) => {
  const data = await restaurantService.getAllAdmin();
  res.json({ ok: true, data });
});

const updateRestaurant = catchAsync(async (req, res) => {
  await restaurantService.update(req.params.id, req.body);
  res.json({ ok: true, message: 'Restaurante actualizado exitosamente' });
});

const deleteRestaurant = catchAsync(async (req, res) => {
  await restaurantService.delete(req.params.id);
  res.json({ ok: true, message: 'Restaurante y datos vinculados eliminados' });
});

const getPendingDishes = catchAsync(async (req, res) => {
  const data = await restaurantService.getPendingDishes();
  res.json({ ok: true, data });
});

const getMyNotifications = catchAsync(async (req, res) => {
  const data = await restaurantService.getMyNotifications(req.user._id);
  res.json({ ok: true, data });
});

module.exports = {
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
};
