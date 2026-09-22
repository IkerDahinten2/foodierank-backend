const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  findByEmail(email) {
    return this.findOne({ email });
  }
}

module.exports = new UserRepository();
