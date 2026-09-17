const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log('MongoDB conectado exitosamente con driver nativo');
    return db;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('La base de datos no está inicializada. Llama a connectDB primero.');
  }
  return db;
}

function getClient() {
  if (!client) {
    throw new Error('El cliente de MongoDB no está conectado.');
  }
  return client;
}

module.exports = { connectDB, getDB, getClient };