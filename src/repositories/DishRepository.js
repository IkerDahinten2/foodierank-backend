const { ObjectId } = require('mongodb');
const BaseRepository = require('./BaseRepository');

class DishRepository extends BaseRepository {
  constructor() {
    super('dishes');
  }

  findByRestaurantApproved(restauranteId) {
    return this.find({ restauranteId: new ObjectId(restauranteId), estado: 'aprobado' });
  }

  findByNombreEnRestaurante(restauranteId, nombre) {
    return this.findOne({
      restauranteId: new ObjectId(restauranteId),
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });
  }

  findPendientes() {
    return this.find({ estado: 'pendiente' });
  }

  findPendientesDeAvisoConRestaurante(userId) {
    return this.aggregate([
      {
        $match: {
          creadoPor: userId,
          estado: { $in: ['aprobado', 'rechazado'] },
          notificado: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restauranteId',
          foreignField: '_id',
          as: 'restaurante'
        }
      },
      { $unwind: { path: '$restaurante', preserveNullAndEmptyArrays: true } }
    ]);
  }

  markAsNotified(ids) {
    if (!ids.length) return Promise.resolve();
    return this.updateMany({ _id: { $in: ids } }, { $set: { notificado: true } });
  }

  setEstado(id, estado, extraFields = {}) {
    return this.updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado, ...extraFields } }
    );
  }

  deleteByRestaurant(restauranteId) {
    return this.deleteMany({ restauranteId: new ObjectId(restauranteId) });
  }
}

module.exports = new DishRepository();
