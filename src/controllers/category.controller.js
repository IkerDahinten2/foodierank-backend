const catchAsync = require('../utils/catchAsync');
const categoryService = require('../services/CategoryService');

const getCategories = catchAsync(async (req, res) => {
  const data = await categoryService.list();
  res.json({ ok: true, data });
});

const getCategoryById = catchAsync(async (req, res) => {
  const data = await categoryService.getById(req.params.id);
  res.json({ ok: true, data });
});

const createCategory = catchAsync(async (req, res) => {
  const data = await categoryService.create(req.body);
  res.status(201).json({ ok: true, message: 'Categoría creada exitosamente', data });
});

const updateCategory = catchAsync(async (req, res) => {
  await categoryService.update(req.params.id, req.body);
  res.json({ ok: true, message: 'Categoría actualizada exitosamente' });
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.delete(req.params.id);
  res.json({ ok: true, message: 'Categoría eliminada exitosamente' });
});

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };