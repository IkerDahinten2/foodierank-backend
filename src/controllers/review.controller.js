const { ObjectId } = require('mongodb');
const { getDB, getClient } = require('../config/database');
const { calculateWeightedRanking } = require('../utils/ranking');

// 1. Crear Reseña y Actualizar Ranking de Restaurante (Transacción Atómica)
async function createReview(req, res) {
  const client = getClient();
  const session = client.startSession();

  try {
    const { restauranteId, calificacion, comentario } = req.body;
    const usuarioId = req.user._id;

    let reviewCreada = null;

    // Ejecución transaccional: si algo falla, withTransaction revierte todo automáticamente
    await session.withTransaction(async () => {
      const db = getDB();
      const restaurantsCol = db.collection('restaurants');
      const reviewsCol = db.collection('reviews');

      // Verificar que el restaurante exista y esté aprobado
      const restaurant = await restaurantsCol.findOne(
        { _id: new ObjectId(restauranteId), estado: 'aprobado' },
        { session }
      );
      if (!restaurant) {
        throw new Error('El restaurante no existe o no ha sido aprobado aún');
      }

      // // Evitar que el mismo usuario publique múltiples reseñas en un mismo restaurante
      // const existingReview = await reviewsCol.findOne(
      //   { restauranteId: new ObjectId(restauranteId), usuarioId: new ObjectId(usuarioId) },
      //   { session }
      // );
      // if (existingReview) {
      //   throw new Error('Ya has publicado una reseña en este restaurante. Puedes editarla.');
      // }

      // A. Insertar la nueva reseña
      const nuevaResena = {
        restauranteId: new ObjectId(restauranteId),
        usuarioId: new ObjectId(usuarioId),
        calificacion: parseInt(calificacion, 10),
        comentario: comentario.trim(),
        likes: [],
        dislikes: [],
        fechaCreacion: new Date()
      };

      const insertResult = await reviewsCol.insertOne(nuevaResena, { session });
      nuevaResena._id = insertResult.insertedId;
      reviewCreada = nuevaResena;

      // B. Consultar todas las reseñas del restaurante (incluyendo la nueva) para recalcular
      const allReviews = await reviewsCol.find(
        { restauranteId: new ObjectId(restauranteId) },
        { session }
      ).toArray();

      const newRanking = calculateWeightedRanking(allReviews);

      // C. Actualizar el restaurante dentro de la misma sesión
      await restaurantsCol.updateOne(
        { _id: new ObjectId(restauranteId) },
        {
          $set: {
            ranking: newRanking,
            totalResenas: allReviews.length,
            fechaUltimaResena: new Date()
          }
        },
        { session }
      );
    });

    res.status(201).json({
      ok: true,
      message: 'Reseña registrada y ranking actualizado exitosamente',
      data: reviewCreada
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  } finally {
    await session.endSession();
  }
}

// 2. Votar Reseña: Likes y Dislikes (Transacción Atómica con Regla Anti-AutoVoto)
async function voteReview(req, res) {
  const client = getClient();
  const session = client.startSession();

  try {
    const { id } = req.params; // ID de la reseña
    const { tipo } = req.body; // 'like' o 'dislike'
    const usuarioId = req.user._id;

    await session.withTransaction(async () => {
      const db = getDB();
      const reviewsCol = db.collection('reviews');
      const restaurantsCol = db.collection('restaurants');

      const review = await reviewsCol.findOne({ _id: new ObjectId(id) }, { session });
      if (!review) {
        throw new Error('Reseña no encontrada');
      }

      // Regla de Negocio: No puedes votar tu propia reseña
      if (review.usuarioId.toString() === usuarioId.toString()) {
        throw new Error('No tienes permitido votar tus propias reseñas');
      }

      // Manejo de arrays atómicos: sacar de la lista opuesta y alternar el voto actual
      const opuesto = tipo === 'like' ? 'dislikes' : 'likes';
      const actual = tipo === 'like' ? 'likes' : 'dislikes';

      // 1. Quitar de la lista opuesta (si antes dio dislike y ahora da like)
      await reviewsCol.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { [opuesto]: usuarioId } },
        { session }
      );

      // 2. Si ya lo tenía en la lista actual lo removemos (toggle), sino lo agregamos
      const yaVoto = review[actual] && review[actual].some(uid => uid.toString() === usuarioId.toString());

      if (yaVoto) {
        await reviewsCol.updateOne(
          { _id: new ObjectId(id) },
          { $pull: { [actual]: usuarioId } },
          { session }
        );
      } else {
        await reviewsCol.updateOne(
          { _id: new ObjectId(id) },
          { $addToSet: { [actual]: usuarioId } },
          { session }
        );
      }

      // 3. Recalcular el ranking ponderado del restaurante tras el cambio de votos
      const allReviews = await reviewsCol.find(
        { restauranteId: review.restauranteId },
        { session }
      ).toArray();

      const newRanking = calculateWeightedRanking(allReviews);

      await restaurantsCol.updateOne(
        { _id: review.restauranteId },
        { $set: { ranking: newRanking } },
        { session }
      );
    });

    res.json({ ok: true, message: `Voto registrado correctamente` });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  } finally {
    await session.endSession();
  }
}

// 3. Listar Reseñas de un Restaurante
async function getRestaurantReviews(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    const reviews = await db.collection('reviews').aggregate([
      { $match: { restauranteId: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'usuarioId',
          foreignField: '_id',
          as: 'autor'
        }
      },
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
    ]).toArray();

    res.json({ ok: true, data: reviews });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al consultar reseñas', error: error.message });
  }
}

// 4. Eliminar Reseña (Solo autor o Admin) con Recálculo Transaccional
async function deleteReview(req, res) {
  const client = getClient();
  const session = client.startSession();

  try {
    const { id } = req.params;
    const user = req.user;

    await session.withTransaction(async () => {
      const db = getDB();
      const reviewsCol = db.collection('reviews');
      const restaurantsCol = db.collection('restaurants');

      const review = await reviewsCol.findOne({ _id: new ObjectId(id) }, { session });
      if (!review) {
        throw new Error('Reseña no encontrada');
      }

      // Permisos: autor o administrador
      if (user.rol !== 'admin' && review.usuarioId.toString() !== user._id.toString()) {
        throw new Error('No tienes permisos para eliminar esta reseña');
      }

      await reviewsCol.deleteOne({ _id: new ObjectId(id) }, { session });

      // Recalcular métricas del restaurante
      const allReviews = await reviewsCol.find(
        { restauranteId: review.restauranteId },
        { session }
      ).toArray();

      const newRanking = calculateWeightedRanking(allReviews);

      await restaurantsCol.updateOne(
        { _id: review.restauranteId },
        {
          $set: {
            ranking: newRanking,
            totalResenas: allReviews.length
          }
        },
        { session }
      );
    });

    res.json({ ok: true, message: 'Reseña eliminada y ranking actualizado' });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  } finally {
    await session.endSession();
  }
}

//ACTUALZIAR REVIEWS CONTROLLER
// Listar todas las reseñas para moderación en panel admin
async function getAllReviewsAdmin(req, res) {
  try {
    const db = getDB();
    const reviews = await db.collection('reviews').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'usuarioId',
          foreignField: '_id',
          as: 'autor'
        }
      },
      { $unwind: { path: '$autor', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restauranteId',
          foreignField: '_id',
          as: 'restaurante'
        }
      },
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
    ]).toArray();

    res.json({ ok: true, data: reviews });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener reseñas', error: error.message });
  }
}

module.exports = {
  createReview,
  voteReview,
  getRestaurantReviews,
  deleteReview,
  getAllReviewsAdmin
};