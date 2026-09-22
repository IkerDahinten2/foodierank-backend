const { ObjectId } = require('mongodb');
const BaseRepository = require('./BaseRepository');

class RestaurantRepository extends BaseRepository {
  constructor() {
    super('restaurants');
  }

  findApproved(query = {}) {
    return this.find({ ...query, estado: 'aprobado' });
  }

  findByNombre(nombre) {
    return this.findOne({ nombre: { $regex: new RegExp(`^${nombre}$`, 'i') } });
  }

  findByOwner(userId) {
    return this.find({ creadoPor: userId }, { sort: { fechaCreacion: -1 } });
  }

  findPendientesDeAviso(userId) {
    return this.find({
      creadoPor: userId,
      estado: { $in: ['aprobado', 'rechazado'] },
      notificado: { $ne: true }
    });
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
}

module.exports = new RestaurantRepository();
