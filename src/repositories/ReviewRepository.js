const { ObjectId } = require('mongodb');
const BaseRepository = require('./BaseRepository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super('reviews');
  }

  findByRestaurant(restauranteId, options = {}) {
    return this.find({ restauranteId: new ObjectId(restauranteId) }, options);
  }

  findByRestaurantWithAutor(restauranteId) {
    return this.aggregate([
      { $match: { restauranteId: new ObjectId(restauranteId) } },
      { $lookup: { from: 'users', localField: 'usuarioId', foreignField: '_id', as: 'autor' } },
      { $unwind: '$autor' },
      {
        $project: {
          _id: 1,
          calificacion: 1,
          comentario: 1,
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          dislikesCount: { $size: { $ifNull: ['$dislikes', []] } },
          fechaCreacion: 1,
          'autor.nombre': 1,
          'autor._id': 1
        }
      },
      { $sort: { fechaCreacion: -1 } }
    ]);
  }

  findAllWithAutorYRestaurante() {
    return this.aggregate([
      { $lookup: { from: 'users', localField: 'usuarioId', foreignField: '_id', as: 'autor' } },
      { $unwind: { path: '$autor', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'restaurants', localField: 'restauranteId', foreignField: '_id', as: 'restaurante' } },
      { $unwind: { path: '$restaurante', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          calificacion: 1,
          comentario: 1,
          fechaCreacion: 1,
          'autor.nombre': 1,
          'restaurante.nombre': 1,
          'restaurante._id': 1
        }
      },
      { $sort: { fechaCreacion: -1 } }
    ]);
  }

  deleteByRestaurant(restauranteId) {
    return this.deleteMany({ restauranteId: new ObjectId(restauranteId) });
  }
}

module.exports = new ReviewRepository();
