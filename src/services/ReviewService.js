const { ObjectId } = require('mongodb');
const AppError = require('../errors/AppError');
const database = require('../config/database');
const { calculateWeightedRanking } = require('../utils/ranking');
const { CreateReviewDTO } = require('../dtos/ReviewDTO');
const reviewRepository = require('../repositories/ReviewRepository');
const restaurantRepository = require('../repositories/RestaurantRepository');

class ReviewService {
  async create(body, usuarioId) {
    const dto = new CreateReviewDTO(body);
    const client = database.getClient();
    const session = client.startSession();
    let reviewCreada = null;

    try {
      await session.withTransaction(async () => {
        const restaurant = await restaurantRepository.collection.findOne(
          { _id: new ObjectId(dto.restauranteId), estado: 'aprobado' },
          { session }
        );
        if (!restaurant) throw AppError.badRequest('El restaurante no existe o no ha sido aprobado aún');

        const nuevaResena = dto.toPersistence(usuarioId);
        const insertResult = await reviewRepository.collection.insertOne(nuevaResena, { session });
        nuevaResena._id = insertResult.insertedId;
        reviewCreada = nuevaResena;

        const allReviews = await reviewRepository.collection
          .find({ restauranteId: new ObjectId(dto.restauranteId) }, { session })
          .toArray();
        const newRanking = calculateWeightedRanking(allReviews);

        await restaurantRepository.collection.updateOne(
          { _id: new ObjectId(dto.restauranteId) },
          { $set: { ranking: newRanking, totalResenas: allReviews.length, fechaUltimaResena: new Date() } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return reviewCreada;
  }

  async vote(reviewId, tipo, usuarioId) {
    const client = database.getClient();
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const review = await reviewRepository.collection.findOne({ _id: new ObjectId(reviewId) }, { session });
        if (!review) throw AppError.notFound('Reseña no encontrada');

        if (review.usuarioId.toString() === usuarioId.toString()) {
          throw AppError.forbidden('No tienes permitido votar tus propias reseñas');
        }

        const opuesto = tipo === 'like' ? 'dislikes' : 'likes';
        const actual = tipo === 'like' ? 'likes' : 'dislikes';

        await reviewRepository.collection.updateOne(
          { _id: new ObjectId(reviewId) },
          { $pull: { [opuesto]: usuarioId } },
          { session }
        );

        const yaVoto = review[actual] && review[actual].some((uid) => uid.toString() === usuarioId.toString());
        const op = yaVoto ? { $pull: { [actual]: usuarioId } } : { $addToSet: { [actual]: usuarioId } };
        await reviewRepository.collection.updateOne({ _id: new ObjectId(reviewId) }, op, { session });

        const allReviews = await reviewRepository.collection
          .find({ restauranteId: review.restauranteId }, { session })
          .toArray();
        const newRanking = calculateWeightedRanking(allReviews);

        await restaurantRepository.collection.updateOne(
          { _id: review.restauranteId },
          { $set: { ranking: newRanking } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  listByRestaurant(restauranteId) {
    return reviewRepository.findByRestaurantWithAutor(restauranteId);
  }

  async delete(reviewId, user) {
    const client = database.getClient();
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const review = await reviewRepository.collection.findOne({ _id: new ObjectId(reviewId) }, { session });
        if (!review) throw AppError.notFound('Reseña no encontrada');

        if (user.rol !== 'admin' && review.usuarioId.toString() !== user._id.toString()) {
          throw AppError.forbidden('No tienes permisos para eliminar esta reseña');
        }

        await reviewRepository.collection.deleteOne({ _id: new ObjectId(reviewId) }, { session });

        const allReviews = await reviewRepository.collection
          .find({ restauranteId: review.restauranteId }, { session })
          .toArray();
        const newRanking = calculateWeightedRanking(allReviews);

        await restaurantRepository.collection.updateOne(
          { _id: review.restauranteId },
          { $set: { ranking: newRanking, totalResenas: allReviews.length } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  listAllAdmin() {
    return reviewRepository.findAllWithAutorYRestaurante();
  }
}

module.exports = new ReviewService();
