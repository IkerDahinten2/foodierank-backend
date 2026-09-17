const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

// 1. Listar todas las categorías (Público)
async function getCategories(req, res) {
  try {
    const db = getDB();
    const categories = await db.collection('categories').find({}).toArray();
    res.json({ ok: true, data: categories });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener categorías', error: error.message });
  }
}

// 2. Obtener una categoría por ID (Público)
async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    const category = await db.collection('categories').findOne({ _id: new ObjectId(id) });

    if (!category) {
      return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
    }

    res.json({ ok: true, data: category });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al buscar categoría', error: error.message });
  }
}

// 3. Crear categoría (Solo Admin)
async function createCategory(req, res) {
  try {
    const { nombre, descripcion } = req.body;
    const db = getDB();
    const categoriesCol = db.collection('categories');

    // Comprobar que no exista una categoría con el mismo nombre (ignora mayúsculas)
    const existing = await categoriesCol.findOne({
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ ok: false, message: 'La categoría ya existe' });
    }

    const newCategory = {
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : '',
      fechaCreacion: new Date()
    };

    const result = await categoriesCol.insertOne(newCategory);

    res.status(201).json({
      ok: true,
      message: 'Categoría creada exitosamente',
      data: { _id: result.insertedId, ...newCategory }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al crear categoría', error: error.message });
  }
}

// 4. Actualizar categoría (Solo Admin)
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const db = getDB();
    const categoriesCol = db.collection('categories');

    // Evitar que colisione con el nombre de OTRA categoría existente
    const duplicate = await categoriesCol.findOne({
      _id: { $ne: new ObjectId(id) },
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
    });

    if (duplicate) {
      return res.status(400).json({ ok: false, message: 'Ya existe otra categoría con este nombre' });
    }

    const updateFields = {
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : '',
      fechaActualizacion: new Date()
    };

    const result = await categoriesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
    }

    res.json({ ok: true, message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al actualizar categoría', error: error.message });
  }
}

// 5. Eliminar categoría (Solo Admin)
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    const categoriesCol = db.collection('categories');

    const result = await categoriesCol.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
    }

    res.json({ ok: true, message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar categoría', error: error.message });
  }
}

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};