const { ObjectId } = require('mongodb');
const BaseRepository = require('./BaseRepository');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  findByNombre(nombre) {
    return this.findOne({ nombre: { $regex: new RegExp(`^${nombre}$`, 'i') } });
  }

  findByNombreExcludingId(nombre, id) {
    return this.findOne({
      _id: { $ne: new ObjectId(id) },
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });
  }
}

module.exports = new CategoryRepository();
