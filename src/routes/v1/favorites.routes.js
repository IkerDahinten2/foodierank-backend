const express = require('express');
const router = express.Router();
const {
    createFavoriteRestaurant,
    createFavoriteDish,
    deleteFavoriteRestaurant,
    deleteFavoriteDish,
    getMyFavorites
} = require('../../controllers/favoritos.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');
const { validateCategoryBody, validateCategoryId } = require('../../middlewares/favoritoValidator');

//agregar favoritoValidator

// Rutas Públicas (Cualquiera puede consultar las categorías)
router.get('/', getCategories);
router.get('/:id', validateCategoryId, getCategoryById);

// Rutas Protegidas (Requieren Login + Rol Admin)
router.post('/', requireAuth, validateFavorito, createFavorito);
router.put('/:id', requireAuth, validateFavorito, createFavorito);
router.delete('/:id', requireAuth, validateFavorito, createFavorito);

router.use(verificarAuth);

router.get('/', listarFavoritos);
router.post('/:restauranteId', agregarFavorito);
router.delete('/:restauranteId', eliminarFavorito);


module.exports = router;
