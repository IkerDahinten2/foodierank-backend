const { ObjectId } = require('mongodb');
const AppError = require('../errors/AppError');
const database = require('../config/database');
const { CreateRestaurantDTO, CreateRestaurantWithDishDTO, UpdateRestaurantDTO } = require('../dtos/RestaurantDTO');
const { CreateDishDTO } = require('../dtos/DishDTO');
const restaurantRepository = require('../repositories/RestaurantRepository');
const dishRepository = require('../repositories/DishRepository');
const reviewRepository = require('../repositories/ReviewRepository');
const categoryRepository = require('../repositories/CategoryRepository');

class RestaurantService {
  listApproved(categoriaId) {
    const query = {};
    if (categoriaId && ObjectId.isValid(categoriaId)) {
      query.categoriaId = new ObjectId(categoriaId);
    }
    return restaurantRepository.findApproved(query);
  }

  async getByIdWithDishes(id) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw AppError.notFound('Restaurante no encontrado');

    const platos = await dishRepository.findByRestaurantApproved(id);
    return { ...restaurant, platos };
  }

  async create(body, user) {
    const dto = new CreateRestaurantDTO(body);

    const existing = await restaurantRepository.findByNombre(dto.nombre);
    if (existing) throw AppError.conflict('Ya existe un restaurante con este nombre');

    const category = await categoryRepository.findById(dto.categoriaId);
    if (!category) throw AppError.badRequest('La categoría asignada no existe');

    const estado = user.rol === 'admin' ? 'aprobado' : 'pendiente';
    const doc = dto.toPersistence({ estado, creadoPor: user._id });
    const result = await restaurantRepository.insertOne(doc);

    return {
      estado,
      data: { _id: result.insertedId, ...doc }
    };
  }

  async createWithDish(body, user) {
    const dto = new CreateRestaurantWithDishDTO(body);
    const client = database.getClient();
    const session = client.startSession();
    let resultado = null;

    try {
      await session.withTransaction(async () => {
        const existingRestaurant = await restaurantRepository.collection.findOne(
          { nombre: { $regex: new RegExp(`^${dto.nombre}$`, 'i') } },
          { session }
        );
        if (existingRestaurant) throw AppError.conflict('Ya existe un restaurante con este nombre');

        const category = await categoryRepository.collection.findOne(
          { _id: new ObjectId(dto.categoriaId) },
          { session }
        );
        if (!category) throw AppError.badRequest('La categoría asignada no existe');

        const estado = user.rol === 'admin' ? 'aprobado' : 'pendiente';

        const nuevoRestaurante = dto.restaurantToPersistence({ estado, creadoPor: user._id });
        const restInsert = await restaurantRepository.collection.insertOne(nuevoRestaurante, { session });
        nuevoRestaurante._id = restInsert.insertedId;

        const nuevoPlato = dto.dishToPersistence({
          restauranteId: nuevoRestaurante._id,
          estado,
          creadoPor: user._id
        });
        const dishInsert = await dishRepository.collection.insertOne(nuevoPlato, { session });
        nuevoPlato._id = dishInsert.insertedId;

        resultado = { estado, restaurante: nuevoRestaurante, plato: nuevoPlato };
      });
    } finally {
      await session.endSession();
    }

    return resultado;
  }

  getMine(userId) {
    return restaurantRepository.findByOwner(userId);
  }

  async approve(id) {
    const result = await restaurantRepository.setEstado(id, 'aprobado', {
      fechaAprobacion: new Date(),
      notificado: false
    });
    if (result.matchedCount === 0) throw AppError.notFound('Restaurante no encontrado');
  }

  async reject(id) {
    const result = await restaurantRepository.setEstado(id, 'rechazado', {
      fechaRechazo: new Date(),
      notificado: false
    });
    if (result.matchedCount === 0) throw AppError.notFound('Restaurante no encontrado');
  }

  async createDish(restaurantId, body, user) {
    const dto = new CreateDishDTO(body);

    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw AppError.notFound('Restaurante no encontrado');

    const esDueno = restaurant.creadoPor && restaurant.creadoPor.toString() === user._id.toString();
    if (!esDueno && user.rol !== 'admin') {
      throw AppError.forbidden('No tienes permisos para agregar platos a este restaurante');
    }

    const existingDish = await dishRepository.findByNombreEnRestaurante(restaurantId, dto.nombre);
    if (existingDish) throw AppError.conflict('Este restaurante ya tiene un plato con ese nombre');

    const estado = user.rol === 'admin' ? 'aprobado' : 'pendiente';
    const doc = dto.toPersistence({ restauranteId: new ObjectId(restaurantId), estado, creadoPor: user._id });
    const result = await dishRepository.insertOne(doc);

    return { estado, data: { _id: result.insertedId, ...doc } };
  }

  async approveDish(dishId) {
    const result = await dishRepository.setEstado(dishId, 'aprobado', { notificado: false });
    if (result.matchedCount === 0) throw AppError.notFound('Plato no encontrado');
  }

  async rejectDish(dishId) {
    const result = await dishRepository.setEstado(dishId, 'rechazado', {
      fechaRechazo: new Date(),
      notificado: false
    });
    if (result.matchedCount === 0) throw AppError.notFound('Plato no encontrado');
  }

  getAllAdmin() {
    return restaurantRepository.find({});
  }

  async update(id, body) {
    const dto = new UpdateRestaurantDTO(body);
    const result = await restaurantRepository.updateOne(
      { _id: new ObjectId(id) },
      { $set: dto.toPersistence() }
    );
    if (result.matchedCount === 0) throw AppError.notFound('Restaurante no encontrado');
  }

  async delete(id) {
    await restaurantRepository.deleteOne({ _id: new ObjectId(id) });
    await dishRepository.deleteByRestaurant(id);
    await reviewRepository.deleteByRestaurant(id);
  }

  getPendingDishes() {
    return dishRepository.findPendientes();
  }

  async getMyNotifications(userId) {
    const restaurantes = await restaurantRepository.findPendientesDeAviso(userId);
    const platos = await dishRepository.findPendientesDeAvisoConRestaurante(userId);

    const notificaciones = [
      ...restaurantes.map((r) => ({ tipo: 'restaurante', nombre: r.nombre, estado: r.estado })),
      ...platos.map((p) => ({
        tipo: 'plato',
        nombre: p.nombre,
        estado: p.estado,
        restaurante: p.restaurante ? p.restaurante.nombre : ''
      }))
    ];

    await restaurantRepository.markAsNotified(restaurantes.map((r) => r._id));
    await dishRepository.markAsNotified(platos.map((p) => p._id));

    return notificaciones;
  }
}

module.exports = new RestaurantService();
