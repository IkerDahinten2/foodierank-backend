class CreateCategoryDTO {
  constructor({ nombre, descripcion }) {
    this.nombre = (nombre || '').trim();
    this.descripcion = descripcion ? descripcion.trim() : '';
  }

  toPersistence() {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaCreacion: new Date()
    };
  }
}

class UpdateCategoryDTO {
  constructor({ nombre, descripcion }) {
    this.nombre = (nombre || '').trim();
    this.descripcion = descripcion ? descripcion.trim() : '';
  }

  toPersistence() {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaActualizacion: new Date()
    };
  }
}

module.exports = { CreateCategoryDTO, UpdateCategoryDTO };
