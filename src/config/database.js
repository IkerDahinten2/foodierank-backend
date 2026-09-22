const { MongoClient } = require('mongodb');

/**
 * Encapsula la conexión a MongoDB en una clase (antes eran variables sueltas
 * a nivel de módulo). Se exporta como singleton para que toda la app
 * comparta el mismo cliente/conexión, pero ahora el estado y el
 * comportamiento viven juntos en un solo objeto en vez de estar sueltos.
 */
class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    if (this.db) return this.db;

    const uri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;

    if (!uri || !dbName) {
      console.error('--- No fue posible conectar a MongoDB ---');
      console.error('Motivo: faltan las variables de entorno MONGO_URI y/o DB_NAME. Revisa tu archivo .env (usa .env.example como referencia).');
      console.error('------------------------------------------');
      process.exit(1);
    }

    try {
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000 // Falla rápido con una razón clara en vez de colgarse
      });
      await this.client.connect();

      // connect() puede "tener éxito" con credenciales/URI inválidas hasta el primer
      // comando real; hacemos un ping explícito para confirmar que la conexión sirve.
      await this.client.db(dbName).command({ ping: 1 });

      this.db = this.client.db(dbName);
      console.log(`MongoDB conectado exitosamente a la base "${dbName}" (driver nativo)`);
      return this.db;
    } catch (error) {
      this._logConnectionError(error, uri);
      process.exit(1);
    }
  }

  /**
   * Antes: console.error(error.message) sin más contexto.
   * Ahora: se distingue la causa raíz más probable para que el desarrollador
   * sepa exactamente qué revisar (credenciales, red, DNS, URI mal formada, etc.)
   */
  _logConnectionError(error, uri) {
    console.error('--- No fue posible conectar a MongoDB ---');

    if (error.name === 'MongoServerSelectionError') {
      console.error('Motivo: el servidor no respondió dentro del tiempo de espera.');
      console.error('Revisa: 1) que MongoDB esté corriendo, 2) que la IP de esta máquina esté permitida en "Network Access" si usas Atlas, 3) tu conexión a internet.');
    } else if (/authentication failed/i.test(error.message || '')) {
      console.error('Motivo: usuario o contraseña incorrectos en MONGO_URI.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.error(`Motivo: no se pudo resolver el host de la URI de conexión (${uri ? uri.replace(/\/\/.*@/, '//***:***@') : 'no definida'}).`);
      console.error('Revisa que el string de conexión esté bien escrito y que no haya errores de DNS.');
    } else if (error.name === 'MongoParseError') {
      console.error('Motivo: la variable MONGO_URI tiene un formato inválido.');
    } else {
      console.error(`Motivo: ${error.message}`);
    }

    console.error('------------------------------------------');
  }

  getDB() {
    if (!this.db) {
      throw new Error('La base de datos no está inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  getClient() {
    if (!this.client) {
      throw new Error('El cliente de MongoDB no está conectado.');
    }
    return this.client;
  }
}

// Singleton: una sola instancia para toda la aplicación.
const database = new Database();

// Se mantienen estos exports con el mismo nombre/forma que antes
// (connectDB, getDB, getClient) para no romper ningún import existente.
module.exports = database;
module.exports.connectDB = () => database.connect();
module.exports.getDB = () => database.getDB();
module.exports.getClient = () => database.getClient();
