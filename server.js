require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./src/config/database');
const passport = require('./src/config/passport');

// swagger-ui-express for API documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/docs/swagger.json');

// Importación de rutas versionadas
const authRoutes = require('./src/routes/v1/auth.routes');
const categoryRoutes = require('./src/routes/v1/category.routes');
const restaurantRoutes = require('./src/routes/v1/restaurant.routes');
const reviewRoutes = require('./src/routes/v1/review.routes');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas versionadas (SemVer v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Endpoint de prueba de salud
app.get('/api/v1/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0', status: 'Servidor en línea' });
});

// Iniciar servidor y conectar a Mongo
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api/v1/docs`);
  });
});