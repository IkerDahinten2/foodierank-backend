const { ObjectId } = require('mongodb');
const database = require('../config/database');

//Fix para cada controller: getDB().collection('x'). Ahora: toda operación contra Mongo pasa por una clase Repository.

class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  get collection() {
    return database.getDB().collection(this.collectionName);
  }

  findById(id) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  find(query = {}, options = {}) {
    return this.collection.find(query, options).toArray();
  }

  findOne(query) {
    return this.collection.findOne(query);
  }

  insertOne(doc, options = {}) {
    return this.collection.insertOne(doc, options);
  }

  updateOne(filter, update, options = {}) {
    return this.collection.updateOne(filter, update, options);
  }

  updateMany(filter, update, options = {}) {
    return this.collection.updateMany(filter, update, options);
  }

  deleteOne(filter, options = {}) {
    return this.collection.deleteOne(filter, options);
  }

  deleteMany(filter, options = {}) {
    return this.collection.deleteMany(filter, options);
  }

  aggregate(pipeline, options = {}) {
    return this.collection.aggregate(pipeline, options).toArray();
  }
}

module.exports = BaseRepository;
