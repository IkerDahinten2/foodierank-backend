const { ObjectId } = require('mongodb');

class CreateRestaurantDTO {
  constructor({ nombre, descripcion, categoriaId, ubicacion, imagenUrl }) {
    this.nombre = (nombre || '').trim();
    this.descripcion = (descripcion || '').trim();
    this.categoriaId = categoriaId;
    this.ubicacion = (ubicacion || '').trim();
    this.imagenUrl = imagenUrl ? imagenUrl.trim() : '';
  }

  toPersistence({ estado, creadoPor }) {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      categoriaId: new ObjectId(this.categoriaId),
      ubicacion: this.ubicacion,
      imagenUrl: this.imagenUrl,
      estado,
      creadoPor,
      ranking: 0,
      totalResenas: 0,
      fechaCreacion: new Date()
    };
  }
}

class CreateRestaurantWithDishDTO {
  constructor(body) {
    const {
      nombre, descripcion, categoriaId, ubicacion, horario, imagenUrl,
      platoNombre, platoDescripcion, platoPrecio, platoImagenUrl
    } = body;

    this.nombre = (nombre || '').trim();
    this.descripcion = (descripcion || '').trim();
    this.categoriaId = categoriaId;
    this.ubicacion = (ubicacion || '').trim();
    this.horario = (horario || '').trim();
    this.imagenUrl = (imagenUrl || '').trim();

    this.platoNombre = (platoNombre || '').trim();
    this.platoDescripcion = (platoDescripcion || '').trim();
    this.platoPrecio = parseFloat(platoPrecio);
    this.platoImagenUrl = platoImagenUrl ? platoImagenUrl.trim() : '';
  }

  restaurantToPersistence({ estado, creadoPor }) {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      categoriaId: new ObjectId(this.categoriaId),
      ubicacion: this.ubicacion,
      horario: this.horario,
      imagenUrl: this.imagenUrl,
      estado,
      creadoPor,
      ranking: 0,
      totalResenas: 0,
      notificado: false,
      fechaCreacion: new Date()
    };
  }

  dishToPersistence({ restauranteId, estado, creadoPor }) {
    return {
      restauranteId,
      nombre: this.platoNombre,
      descripcion: this.platoDescripcion,
      precio: this.platoPrecio,
      imagenUrl: this.platoImagenUrl,
      estado,
      creadoPor,
      ranking: 0,
      totalResenas: 0,
      notificado: false,
      fechaCreacion: new Date()
    };
  }
}

class UpdateRestaurantDTO {
  constructor({ nombre, descripcion, ubicacion, horario, imagenUrl }) {
    this.fields = {};
    if (nombre) this.fields.nombre = nombre.trim();
    if (descripcion) this.fields.descripcion = descripcion.trim();
    if (ubicacion) this.fields.ubicacion = ubicacion.trim();
    if (horario) this.fields.horario = horario.trim();
    if (imagenUrl) this.fields.imagenUrl = imagenUrl.trim();
  }

  toPersistence() {
    return { ...this.fields, fechaEdicion: new Date() };
  }
}

module.exports = { CreateRestaurantDTO, CreateRestaurantWithDishDTO, UpdateRestaurantDTO };
