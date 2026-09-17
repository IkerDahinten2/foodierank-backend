const { ObjectId } = require('mongodb');
const { getDB, getClient } = require('../config/database');

// 1. Listar restaurantes aprobados (con filtro opcional por categoriaId)
async function getRestaurants(req, res) {
  try {
    const { categoriaId } = req.query;
    const db = getDB();

    const query = { estado: 'aprobado' };
    if (categoriaId && ObjectId.isValid(categoriaId)) {
      query.categoriaId = new ObjectId(categoriaId);
    }

    const restaurants = await db.collection('restaurants').find(query).toArray();
    res.json({ ok: true, data: restaurants });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener restaurantes', error: error.message });
  }
}

// 2. Detalle de restaurante + Platos aprobados
async function getRestaurantById(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    const restaurant = await db.collection('restaurants').findOne({ _id: new ObjectId(id) });
    if (!restaurant) {
      return res.status(404).json({ ok: false, message: 'Restaurante no encontrado' });
    }

    // Buscar platos aprobados vinculados a este restaurante
    const dishes = await db.collection('dishes').find({
      restauranteId: new ObjectId(id),
      estado: 'aprobado'
    }).toArray();

    res.json({
      ok: true,
      data: {
        ...restaurant,
        platos: dishes
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al consultar restaurante', error: error.message });
  }
}

// 3. Crear restaurante (Entra como 'pendiente' o 'aprobado' si lo crea un admin)
async function createRestaurant(req, res) {
  try {
    const { nombre, descripcion, categoriaId, ubicacion, imagenUrl } = req.body;
    const db = getDB();
    const col = db.collection('restaurants');

    // Validación anti-duplicados por nombre
    const existing = await col.findOne({
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ ok: false, message: 'Ya existe un restaurante con este nombre' });
    }

    // Verificar que la categoría exista
    const category = await db.collection('categories').findOne({ _id: new ObjectId(categoriaId) });
    if (!category) {
      return res.status(400).json({ ok: false, message: 'La categoría asignada no existe' });
    }

    const nuevoRestaurante = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoriaId: new ObjectId(categoriaId),
      ubicacion: ubicacion.trim(),
      imagenUrl: imagenUrl || '',
      estado: req.user.rol === 'admin' ? 'aprobado' : 'pendiente',
      creadoPor: req.user._id,
      ranking: 0,
      totalResenas: 0,
      fechaCreacion: new Date()
    };

    const result = await col.insertOne(nuevoRestaurante);

    res.status(201).json({
      ok: true,
      message: nuevoRestaurante.estado === 'aprobado' 
        ? 'Restaurante creado y aprobado' 
        : 'Restaurante registrado, pendiente de moderación por un administrador',
      data: { _id: result.insertedId, ...nuevoRestaurante }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al registrar restaurante', error: error.message });
  }
}

// 3.1 NUEVO: Crear restaurante + su primer plato en una sola transacción
// Usado por el flujo público de "Registrar mi Restaurante" (usuarios normales).
// Exige que todo restaurante nuevo nazca con al menos un plato.
async function createRestaurantAndDish(req, res) {
  const client = getClient();
  const session = client.startSession();

  try {
    const {
      nombre, descripcion, categoriaId, ubicacion, horario, imagenUrl,
      platoNombre, platoDescripcion, platoPrecio, platoImagenUrl
    } = req.body;

    let resultado = null;

    await session.withTransaction(async () => {
      const db = getDB();
      const restaurantsCol = db.collection('restaurants');
      const dishesCol = db.collection('dishes');
      const categoriesCol = db.collection('categories');

      // Validación anti-duplicados por nombre de restaurante
      const existingRestaurant = await restaurantsCol.findOne(
        { nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') } },
        { session }
      );
      if (existingRestaurant) {
        throw new Error('Ya existe un restaurante con este nombre');
      }

      // Verificar que la categoría exista
      const category = await categoriesCol.findOne({ _id: new ObjectId(categoriaId) }, { session });
      if (!category) {
        throw new Error('La categoría asignada no existe');
      }

      const estadoInicial = req.user.rol === 'admin' ? 'aprobado' : 'pendiente';

      // A. Insertar el restaurante
      const nuevoRestaurante = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoriaId: new ObjectId(categoriaId),
        ubicacion: ubicacion.trim(),
        horario: horario.trim(),
        imagenUrl: imagenUrl.trim(),
        estado: estadoInicial,
        creadoPor: req.user._id,
        ranking: 0,
        totalResenas: 0,
        notificado: false,
        fechaCreacion: new Date()
      };

      const restInsert = await restaurantsCol.insertOne(nuevoRestaurante, { session });
      nuevoRestaurante._id = restInsert.insertedId;

      // B. Insertar el primer plato, vinculado al restaurante recién creado
      const nuevoPlato = {
        restauranteId: nuevoRestaurante._id,
        nombre: platoNombre.trim(),
        descripcion: platoDescripcion.trim(),
        precio: parseFloat(platoPrecio),
        imagenUrl: platoImagenUrl ? platoImagenUrl.trim() : '',
        estado: estadoInicial,
        creadoPor: req.user._id,
        ranking: 0,
        totalResenas: 0,
        notificado: false,
        fechaCreacion: new Date()
      };

      const dishInsert = await dishesCol.insertOne(nuevoPlato, { session });
      nuevoPlato._id = dishInsert.insertedId;

      resultado = { restaurante: nuevoRestaurante, plato: nuevoPlato };
    });

    res.status(201).json({
      ok: true,
      message: resultado.restaurante.estado === 'aprobado'
        ? 'Restaurante y plato creados y aprobados'
        : 'Restaurante y plato enviados para aprobación del administrador',
      data: resultado
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  } finally {
    await session.endSession();
  }
}

// 3.2 NUEVO: Listar los restaurantes creados por el usuario autenticado
// (sin importar su estado), para el formulario de "agregar plato".
async function getMyRestaurants(req, res) {
  try {
    const db = getDB();
    const restaurants = await db.collection('restaurants')
      .find({ creadoPor: req.user._id })
      .sort({ fechaCreacion: -1 })
      .toArray();
    res.json({ ok: true, data: restaurants });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener tus restaurantes', error: error.message });
  }
}

// 4. Aprobar restaurante (Solo Admin)
async function approveRestaurant(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.collection('restaurants').updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'aprobado', fechaAprobacion: new Date(), notificado: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Restaurante no encontrado' });
    }

    res.json({ ok: true, message: 'Restaurante aprobado con éxito' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al aprobar restaurante', error: error.message });
  }
}

// 4.1 NUEVO: Rechazar restaurante (Solo Admin)
async function rejectRestaurant(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.collection('restaurants').updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'rechazado', fechaRechazo: new Date(), notificado: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Restaurante no encontrado' });
    }

    res.json({ ok: true, message: 'Restaurante rechazado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al rechazar restaurante', error: error.message });
  }
}

// 5. Agregar plato a un restaurante
async function createDish(req, res) {
  try {
    const { id } = req.params; // ID del restaurante
    const { nombre, descripcion, precio, imagenUrl } = req.body;
    const db = getDB();

    // Comprobar existencia del restaurante
    const restaurant = await db.collection('restaurants').findOne({ _id: new ObjectId(id) });
    if (!restaurant) {
      return res.status(404).json({ ok: false, message: 'Restaurante no encontrado' });
    }

    // Seguridad: solo el dueño del restaurante o un administrador
    // pueden agregarle platos.
    const esDueno = restaurant.creadoPor && restaurant.creadoPor.toString() === req.user._id.toString();
    if (!esDueno && req.user.rol !== 'admin') {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para agregar platos a este restaurante' });
    }

    // Evitar nombres repetidos dentro del mismo restaurante
    const colDishes = db.collection('dishes');
    const existingDish = await colDishes.findOne({
      restauranteId: new ObjectId(id),
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
    });

    if (existingDish) {
      return res.status(400).json({ ok: false, message: 'Este restaurante ya tiene un plato con ese nombre' });
    }

    const nuevoPlato = {
      restauranteId: new ObjectId(id),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: parseFloat(precio),
      imagenUrl: imagenUrl ? imagenUrl.trim() : '',
      estado: req.user.rol === 'admin' ? 'aprobado' : 'pendiente',
      creadoPor: req.user._id,
      notificado: false,
      fechaCreacion: new Date()
    };

    const result = await colDishes.insertOne(nuevoPlato);

    res.status(201).json({
      ok: true,
      message: nuevoPlato.estado === 'aprobado' ? 'Plato creado y aprobado' : 'Plato enviado para aprobación',
      data: { _id: result.insertedId, ...nuevoPlato }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al crear plato', error: error.message });
  }
}

// 6. Aprobar plato (Solo Admin)
async function approveDish(req, res) {
  try {
    const { dishId } = req.params;
    const db = getDB();

    const result = await db.collection('dishes').updateOne(
      { _id: new ObjectId(dishId) },
      { $set: { estado: 'aprobado', notificado: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Plato no encontrado' });
    }

    res.json({ ok: true, message: 'Plato aprobado con éxito' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al aprobar plato', error: error.message });
  }
}

// 6.1 NUEVO: Rechazar plato (Solo Admin)
async function rejectDish(req, res) {
  try {
    const { dishId } = req.params;
    const db = getDB();

    const result = await db.collection('dishes').updateOne(
      { _id: new ObjectId(dishId) },
      { $set: { estado: 'rechazado', fechaRechazo: new Date(), notificado: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Plato no encontrado' });
    }

    res.json({ ok: true, message: 'Plato rechazado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al rechazar plato', error: error.message });
  }
}

// MODIFICACIONES DE GESTION DE RESTAURANTES PANEL ADMIN
// Obtener TODOS los restaurantes (para el admin, sin filtrar por aprobado)
async function getAllRestaurantsAdmin(req, res) {
  try {
    const db = getDB();
    const restaurants = await db.collection('restaurants').find({}).toArray();
    res.json({ ok: true, data: restaurants });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener restaurantes', error: error.message });
  }
}

// Editar restaurante (Solo Admin)
async function updateRestaurant(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, ubicacion, horario, imagenUrl } = req.body;
    const db = getDB();

    const updateData = {
      ...(nombre && { nombre: nombre.trim() }),
      ...(descripcion && { descripcion: descripcion.trim() }),
      ...(ubicacion && { ubicacion: ubicacion.trim() }),
      ...(horario && { horario: horario.trim() }),
      ...(imagenUrl && { imagenUrl: imagenUrl.trim() }),
      fechaEdicion: new Date()
    };

    const result = await db.collection('restaurants').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Restaurante no encontrado' });
    }

    res.json({ ok: true, message: 'Restaurante actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
}

// Eliminar restaurante (Solo Admin)
async function deleteRestaurant(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    await db.collection('restaurants').deleteOne({ _id: new ObjectId(id) });
    await db.collection('dishes').deleteMany({ restauranteId: new ObjectId(id) });
    await db.collection('reviews').deleteMany({ restauranteId: new ObjectId(id) });

    res.json({ ok: true, message: 'Restaurante y datos vinculados eliminados' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
}

// Listar platos pendientes de moderación
async function getPendingDishes(req, res) {
  try {
    const db = getDB();
    const dishes = await db.collection('dishes').find({ estado: 'pendiente' }).toArray();
    res.json({ ok: true, data: dishes });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener platos', error: error.message });
  }
}

// NUEVO: Notificaciones de decisiones del admin para el dueño de restaurantes/platos.
// Se muestran una sola vez: al consultarlas se marcan como "ya vistas".
async function getMyNotifications(req, res) {
  try {
    const db = getDB();
    const userId = req.user._id;

    const restaurantsCol = db.collection('restaurants');
    const dishesCol = db.collection('dishes');

    // Restaurantes propios recién decididos que aún no se le han avisado al dueño
    const restaurantesPendientesDeAviso = await restaurantsCol.find({
      creadoPor: userId,
      estado: { $in: ['aprobado', 'rechazado'] },
      notificado: { $ne: true }
    }).toArray();

    // Platos propios en la misma situación (con el nombre de su restaurante)
    const platosPendientesDeAviso = await dishesCol.aggregate([
      {
        $match: {
          creadoPor: userId,
          estado: { $in: ['aprobado', 'rechazado'] },
          notificado: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restauranteId',
          foreignField: '_id',
          as: 'restaurante'
        }
      },
      { $unwind: { path: '$restaurante', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    const notificaciones = [
      ...restaurantesPendientesDeAviso.map(r => ({
        tipo: 'restaurante',
        nombre: r.nombre,
        estado: r.estado
      })),
      ...platosPendientesDeAviso.map(p => ({
        tipo: 'plato',
        nombre: p.nombre,
        estado: p.estado,
        restaurante: p.restaurante ? p.restaurante.nombre : ''
      }))
    ];

    // Marcar como ya notificado para que no se repita en próximos logins
    const idsRestaurantes = restaurantesPendientesDeAviso.map(r => r._id);
    const idsPlatos = platosPendientesDeAviso.map(p => p._id);

    if (idsRestaurantes.length > 0) {
      await restaurantsCol.updateMany(
        { _id: { $in: idsRestaurantes } },
        { $set: { notificado: true } }
      );
    }
    if (idsPlatos.length > 0) {
      await dishesCol.updateMany(
        { _id: { $in: idsPlatos } },
        { $set: { notificado: true } }
      );
    }

    res.json({ ok: true, data: notificaciones });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener notificaciones', error: error.message });
  }
}

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  createRestaurantAndDish,
  getMyRestaurants,
  approveRestaurant,
  rejectRestaurant,
  createDish,
  approveDish,
  rejectDish,
  getAllRestaurantsAdmin, 
  updateRestaurant,  
  deleteRestaurant,   
  getPendingDishes,
  getMyNotifications
};