class CreateDishDTO {
  constructor({ nombre, descripcion, precio, imagenUrl }) {
    this.nombre = (nombre || '').trim();
    this.descripcion = (descripcion || '').trim();
    this.precio = parseFloat(precio);
    this.imagenUrl = imagenUrl ? imagenUrl.trim() : '';
  }

  toPersistence({ restauranteId, estado, creadoPor }) {
    return {
      restauranteId,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: this.precio,
      imagenUrl: this.imagenUrl,
      estado,
      creadoPor,
      notificado: false,
      fechaCreacion: new Date()
    };
  }
}

module.exports = { CreateDishDTO };
