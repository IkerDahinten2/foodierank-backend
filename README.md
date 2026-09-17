# 🍽️ FoodieRank API — Backend & Servicio RESTful

Servicio backend modular desarrollado en **Node.js** y **Express**, responsable del procesamiento de negocio, persistencia de datos, seguridad, control de acceso y cálculo de rankings gastronómicos para la plataforma FoodieRank.

---

## 🔗 Repositorio del Cliente (Frontend)

El cliente web interactivo desarrollado en HTML5, CSS3 y JavaScript Vanilla se gestiona en un repositorio desacoplado:

* **Repositorio Frontend:** [FoodieRank Frontend Web](https://github.com/jdanbo/foodierank-frontend.git)

---

## 📋 Descripción del Proyecto

FoodieRank Backend es una API REST robusta que centraliza la administración gastronómica de restaurantes, platillos, categorías y reseñas comunitarias en Guatemala. Incorpora autenticación mediante tokens criptográficos, un modelo relacional referenciado sobre bases de datos de documentos y un algoritmo de cálculo de popularidad respaldado por transacciones multi-documento reales.

---

## 🏛️ Estructura del Proyecto

La arquitectura sigue una separación estricta de responsabilidades por capas:

foodierank-backend/
├── src/
│   ├── config/                 # Conexión nativa a MongoDB y estrategias de Passport
│   │   ├── database.js
│   │   └── passport.js
│   ├── controllers/            # Controladores de negocio (Auth, Categorías, Restaurantes, Reseñas)
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── restaurant.controller.js
│   │   └── review.controller.js
│   ├── docs/                   # Especificación OpenAPI 3.0 para Swagger UI
│   │   └── swagger.json
│   ├── middlewares/            # Validadores con express-validator y control de roles
│   │   ├── auth.middleware.js
│   │   ├── categoryValidators.js
│   │   ├── restaurantValidators.js
│   │   └── reviewValidators.js
│   ├── routes/v1/              # Enrutadores SemVer v1 (auth, categories, restaurants, reviews)
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── restaurant.routes.js
│   │   └── review.routes.js
│   └── utils/                  # Algoritmo matemático del ranking ponderado
│       └── ranking.js
├── .env.example                # Plantilla de variables de configuración
├── package.json                # Dependencias del ecosistema Node.js
├── seed.js                     # Script de población con datos sintéticos completos
└── server.js                   # Punto de entrada de la aplicación Express

---

## 🧠 Principios Aplicados

* **Separación de Responsabilidades (SoC):** Desacoplamiento estricto entre la definición de rutas, validación de esquemas HTTP, lógica de controladores y acceso a la base de datos[cite: 3].
* **Control de Acceso Basado en Roles (RBAC):** Capas intermedias que inspeccionan los permisos del usuario (`usuario` vs `admin`) impidiendo accesos no autorizados a operaciones de moderación y auditoría.
* **Transacciones Multi-Documento (ACID):** Uso de sesiones transaccionales nativas (`session.withTransaction()`) para asegurar atomicidad e integridad en la inserción de opiniones y actualización simultánea de métricas[cite: 3].
* **Defensa en Profundidad y Sanitización:** Validación rigurosa de tipos, longitudes y formatos mediante `express-validator` antes de que las peticiones alcancen las capas de datos[cite: 3].
* **Versionado Semántico (SemVer):** Todas las rutas se exponen bajo el prefijo unificado `/api/v1/` garantizando retrocompatibilidad ante futuras iteraciones del servicio.

---

## ⚙️ Consideraciones Técnicas

* **Driver Nativo Oficial de MongoDB:** Se prescindió intencionalmente de librerías ODM de alto nivel como Mongoose[cite: 3]. Todas las consultas se ejecutan directamente contra `MongoClient`, manejando proyecciones, agregaciones complejas y cursores nativos[cite: 3].
* **Resiliencia de Red en Atlas:** Soporte para conectividad a través de cadenas con nodos de réplica y puertos explícitos (`:27017`), solventando bloqueos de resolución DNS sobre registros SRV en redes corporativas o de campus.
* **Algoritmo de Ranking Ponderado:** El puntaje final de los restaurantes no es un promedio simple; aplica decaimiento temporal y factores de normalización basados en el respaldo de la comunidad (votos netos de likes y dislikes).
* **Seguridad Perimetral:** Implementación de limitación de tasa de solicitudes (`express-rate-limit`) para mitigación de ataques de fuerza bruta y configuración de cabeceras seguras con CORS.

---

## 🚀 Instrucciones de Instalación y Uso

### 1. Clonar e Instalar Dependencias
git clone https://github.com/IkerDahinten2/foodierank-backend.git
cd foodierank-backend
npm install
npm install express dotenv mongodb jsonwebtoken bcrypt passport passport-jwt express-validator express-rate-limit cors
npm install -D nodemon

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del backend tomando como referencia `.env.example`:
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=foodierank_db
JWT_SECRET=secreto_super_seguro_foodierank_2026

### 3. Poblar la Base de Datos (Seeding)
Carga los 11 evaluadores, categorías, los 8 restaurantes de Guatemala, sus 24 platillos y las 32 reseñas iniciales:
node seed.js

### 4. Iniciar el Servidor
* Modo desarrollo con recarga automática:
  npm run dev
* Modo producción:
  npm start

El servidor iniciará en `http://localhost:3000`.

### 5. Documentación Interactiva de la API
Explora y prueba los endpoints en vivo a través de Swagger UI navegando a:
http://localhost:3000/api/v1/docs

---

## 👥 Créditos

Proyecto desarrollado en equipo:
* **Daniel Borja** **Mauricio Dahinten** — Desarrolladores Backend & Arquitectura de Datos
* **Eduin Salas** Invitado como colaborador con permisos de lectura y revisión en GitHub.