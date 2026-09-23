require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const database = require('./src/config/database');
const { ensureIndexes } = require('./src/config/indexes');
const { applySchemaValidation } = require('./src/config/schemas');
const passport = require('./src/config/passport');
const errorHandler = require('./src/middlewares/errorHandler.middleware');

// swagger-ui-express for API documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/docs/swagger.json');

// Importación de rutas versionadas
const authRoutes = require('./src/routes/v1/auth.routes');
const categoryRoutes = require('./src/routes/v1/category.routes');
const restaurantRoutes = require('./src/routes/v1/restaurant.routes');
const reviewRoutes = require('./src/routes/v1/review.routes');
const favoritesRoutes = require('./src/routes/v1/favorites.routes');


const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = 'v1';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { ok: false, message: 'Demasiadas peticiones desde esta IP, intente más tarde.' }
});

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(passport.initialize());

// Documentación interactiva Swagger UI
app.use(`/api/${API_VERSION}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas versionadas (SemVer v1)
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/restaurants`, restaurantRoutes);
app.use(`/api/${API_VERSION}/reviews`, reviewRoutes);
app.use(`/api/${API_VERSION}/reviews`, favoritesRoutes);

// Endpoint de prueba de salud (expone también la versión de la API, no solo del package.json)
app.get(`/api/${API_VERSION}/health`, (req, res) => {
  res.json({ ok: true, apiVersion: API_VERSION, status: 'Servidor en línea' });
});

// Ruta no encontrada (después de todas las rutas conocidas)
app.use((req, res) => {
  res.status(404).json({ ok: false, code: 'ROUTE_NOT_FOUND', message: 'El endpoint solicitado no existe' });
});

// Middleware de errores: SIEMPRE al final, después de todas las rutas.
// Antes: cada controller devolvía error.message crudo de Mongo al cliente.
// Ahora: cualquier error (de negocio, de validación o del driver de Mongo)
// pasa por aquí y se traduce a una respuesta amigable y segura.
app.use(errorHandler);

// Iniciar servidor: conectar a Mongo, preparar índices y validación de esquema,
// y solo entonces levantar Express.
async function start() {
  const db = await database.connect();
  await ensureIndexes(db);
  await applySchemaValidation(db);

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api/${API_VERSION}/docs`);
  });
}

start();