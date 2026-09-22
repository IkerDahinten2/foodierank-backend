/**
 * Antes: la BD aceptaba cualquier documento; toda la validación vivía
 * únicamente en express-validator (capa de aplicación). Si alguien insertaba
 * datos directo en Mongo (script, migración, otro servicio), no había
 * ninguna barrera.
 *
 * Ahora cada colección tiene su propio $jsonSchema con los campos y tipos
 * mínimos requeridos. validationLevel "moderate" hace que la regla solo
 * aplique a inserts y a updates de documentos que YA eran válidos, para no
 * romper datos existentes de un despliegue previo.
 */
const schemas = {
  users: {
    bsonType: 'object',
    required: ['nombre', 'email', 'password', 'rol'],
    properties: {
      nombre: { bsonType: 'string', minLength: 1 },
      email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
      password: { bsonType: 'string', minLength: 1 },
      rol: { enum: ['usuario', 'admin'] },
      fechaCreacion: { bsonType: 'date' }
    }
  },
  categories: {
    bsonType: 'object',
    required: ['nombre'],
    properties: {
      nombre: { bsonType: 'string', minLength: 3 },
      descripcion: { bsonType: 'string' },
      fechaCreacion: { bsonType: 'date' },
      fechaActualizacion: { bsonType: 'date' }
    }
  },
  restaurants: {
    bsonType: 'object',
    required: ['nombre', 'descripcion', 'categoriaId', 'ubicacion', 'estado'],
    properties: {
      nombre: { bsonType: 'string', minLength: 1 },
      descripcion: { bsonType: 'string', minLength: 1 },
      categoriaId: { bsonType: 'objectId' },
      ubicacion: { bsonType: 'string', minLength: 1 },
      horario: { bsonType: 'string' },
      imagenUrl: { bsonType: 'string' },
      estado: { enum: ['pendiente', 'aprobado', 'rechazado'] },
      creadoPor: { bsonType: 'objectId' },
      ranking: { bsonType: ['double', 'int'] },
      totalResenas: { bsonType: ['double', 'int'] },
      notificado: { bsonType: 'bool' },
      fechaCreacion: { bsonType: 'date' }
    }
  },
  dishes: {
    bsonType: 'object',
    required: ['restauranteId', 'nombre', 'descripcion', 'precio', 'estado'],
    properties: {
      restauranteId: { bsonType: 'objectId' },
      nombre: { bsonType: 'string', minLength: 1 },
      descripcion: { bsonType: 'string', minLength: 1 },
      precio: { bsonType: ['double', 'int'], minimum: 0 },
      imagenUrl: { bsonType: 'string' },
      estado: { enum: ['pendiente', 'aprobado', 'rechazado'] },
      creadoPor: { bsonType: 'objectId' },
      notificado: { bsonType: 'bool' },
      fechaCreacion: { bsonType: 'date' }
    }
  },
  reviews: {
    bsonType: 'object',
    required: ['restauranteId', 'usuarioId', 'calificacion', 'comentario'],
    properties: {
      restauranteId: { bsonType: 'objectId' },
      usuarioId: { bsonType: 'objectId' },
      calificacion: { bsonType: 'int', minimum: 1, maximum: 5 },
      comentario: { bsonType: 'string', maxLength: 500 },
      likes: { bsonType: 'array' },
      dislikes: { bsonType: 'array' },
      fechaCreacion: { bsonType: 'date' }
    }
  }
};

async function applySchemaValidation(db) {
  const existingNames = (await db.listCollections().toArray()).map((c) => c.name);

  for (const [name, schema] of Object.entries(schemas)) {
    const validator = { $jsonSchema: schema };

    if (existingNames.includes(name)) {
      await db.command({
        collMod: name,
        validator,
        validationLevel: 'moderate',
        validationAction: 'error'
      });
    } else {
      await db.createCollection(name, {
        validator,
        validationLevel: 'moderate',
        validationAction: 'error'
      });
    }
  }

  console.log('Validación de esquema ($jsonSchema) aplicada a nivel de base de datos');
}

module.exports = { applySchemaValidation, schemas };
