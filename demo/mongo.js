process.env.MONGO_DBNAME = 'test';
process.env.MONGO_HOST = '172.20.160.7';
process.env.MONGO_PORT = 27017;
const M = require('../src/index').mongo;
const df = {
  name: 'hello',
  width: 18,
  fav: [
    'a'
  ],
  age: {
    type: Number,
    default: 10
  }
};

const m = M('ddff', df);

process.exit();