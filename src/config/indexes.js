/**
 * Antes: ningún índice en toda la base de datos (ni siquiera "email" único).
 * Toda consulta hacía un COLLSCAN completo y no había forma de garantizar
 * unicidad a nivel de BD (solo a nivel de aplicación, con una condición de
 * carrera posible entre el findOne y el insertOne).
 */
async function ensureIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });

  await db.collection('categories').createIndex({ nombre: 1 }, { unique: true, name: 'uniq_nombre' });

  await db.collection('restaurants').createIndex({ categoriaId: 1 }, { name: 'by_categoria' });
  await db.collection('restaurants').createIndex({ estado: 1 }, { name: 'by_estado' });
  await db.collection('restaurants').createIndex({ creadoPor: 1 }, { name: 'by_creador' });
  await db.collection('restaurants').createIndex({ nombre: 1 }, { name: 'by_nombre' });

  await db.collection('dishes').createIndex({ restauranteId: 1 }, { name: 'by_restaurante' });
  await db.collection('dishes').createIndex({ estado: 1 }, { name: 'by_estado' });

  await db.collection('reviews').createIndex({ restauranteId: 1 }, { name: 'by_restaurante' });
  await db.collection('reviews').createIndex({ usuarioId: 1 }, { name: 'by_usuario' });
  await db.collection('reviews').createIndex({ fechaCreacion: -1 }, { name: 'by_fecha_desc' });

  console.log('Índices de MongoDB verificados/creados correctamente');
}

module.exports = { ensureIndexes };
