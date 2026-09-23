const catchAsync = require('../utils/catchAsync');
const restaurantService = require('../services/RestaurantService');

//Crear Favoritos

const createFavoriteRestaurant = catchAsync(async (req, res) => {
  const { estado, data } = await restaurantService.createFavoriteRestaurant (req.params.id, req.user);
  res.status(201).json({
    ok: true,
    message: 'Restaurante agregado a Favoritos' });
});

//falta id de plato
const createFavoriteDish = catchAsync(async (req, res) => {
const { estado, data } = await restaurantService.createFavoriteDish (req.params.id, req.user);
res.status(201).json({
    ok: true,
    message: 'Plato agregado a Favoritos' });
});

//Eliminar Favoritos

const deleteFavoriteRestaurant = catchAsync(async (req, res) => {
  await restaurantService.delete(req.params.id);
  res.json({ ok: true, message: 'Restaurante favorito Elimninado Exitosamente' });
});

const deleteFavoriteDish = catchAsync(async (req, res) => {
    await restaurantService.delete(req.params.id);
    res.json({ ok: true, message: 'Plato favorito Elimninado Exitosamente' });
});

//Listar todos sus favoritos

const getMyFavorites = catchAsync(async (req, res) => {
  const data = await restaurantService.getMyFavorites(req.user._id);
  res.json({ ok: true, data });
});

module.exports = {
    createFavoriteRestaurant,
    createFavoriteDish,
    deleteFavoriteRestaurant,
    deleteFavoriteDish,
    getMyFavorites
};
