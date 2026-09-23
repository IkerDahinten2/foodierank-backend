const AppError = require('../errors/AppError');
const { CreateCategoryDTO, UpdateCategoryDTO } = require('../dtos/CategoryDTO');
const categoryRepository = require('../repositories/CategoryRepository');
const { CreateRestaurantDTO, CreateRestaurantWithDishDTO, UpdateRestaurantDTO } = require('../dtos/RestaurantDTO');
const { CreateDishDTO } = require('../dtos/DishDTO');
const restaurantRepository = require('../repositories/RestaurantRepository');
const dishRepository = require('../repositories/DishRepository');

class FavoritoRestauranteService {
  list() {
    return categoryRepository.find({});
  }

  async getById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw AppError.notFound('Categoría no encontrada');
    return category;
  }

  async create(body) {
    const dto = new CreateCategoryDTO(body);

    const existing = await categoryRepository.findByNombre(dto.nombre);
    if (existing) throw AppError.conflict('La categoría ya existe');

    const doc = dto.toPersistence();
    const result = await categoryRepository.insertOne(doc);
    return { _id: result.insertedId, ...doc };
  }

  async update(id, body) {
    const dto = new UpdateCategoryDTO(body);

    const duplicate = await categoryRepository.findByNombreExcludingId(dto.nombre, id);
    if (duplicate) throw AppError.conflict('Ya existe otra categoría con este nombre');

    const result = await categoryRepository.updateOne({ _id: idToObjectId(id) }, { $set: dto.toPersistence() });
    if (result.matchedCount === 0) throw AppError.notFound('Categoría no encontrada');
  }

  async delete(id) {
    const result = await categoryRepository.deleteOne({ _id: idToObjectId(id) });
    if (result.deletedCount === 0) throw AppError.notFound('Categoría no encontrada');
  }
}

// Pequeño helper local para no repetir el require de ObjectId en cada método
const { ObjectId } = require('mongodb');
function idToObjectId(id) {
  return new ObjectId(id);
}

module.exports = new FavoritoService();
