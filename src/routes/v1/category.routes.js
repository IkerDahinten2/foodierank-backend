const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../../controllers/category.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');
const { validateCategoryBody, validateCategoryId } = require('../../middlewares/categoryValidators');

// Rutas Públicas (Cualquiera puede consultar las categorías)
router.get('/', getCategories);
router.get('/:id', validateCategoryId, getCategoryById);

// Rutas Protegidas (Requieren Login + Rol Admin)
router.post('/', requireAuth, requireRole('admin'), validateCategoryBody, createCategory);
router.put('/:id', requireAuth, requireRole('admin'), validateCategoryId, validateCategoryBody, updateCategory);
router.delete('/:id', requireAuth, requireRole('admin'), validateCategoryId, deleteCategory);

module.exports = router;
