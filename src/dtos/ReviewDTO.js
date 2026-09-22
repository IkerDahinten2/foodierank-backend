const { ObjectId } = require('mongodb');

class CreateReviewDTO {
  constructor({ restauranteId, calificacion, comentario }) {
    this.restauranteId = restauranteId;
    this.calificacion = parseInt(calificacion, 10);
    this.comentario = (comentario || '').trim();
  }

  toPersistence(usuarioId) {
    return {
      restauranteId: new ObjectId(this.restauranteId),
      usuarioId: new ObjectId(usuarioId),
      calificacion: this.calificacion,
      comentario: this.comentario,
      likes: [],
      dislikes: [],
      fechaCreacion: new Date()
    };
  }
}

module.exports = { CreateReviewDTO };
