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

const m = M(df, 'ddff');
// console.log(m.find);process.exit();
m.findOne({}).then(r => {
  console.log(r);
  process.exit();
}).catch(e => {
  console.log(e);
  process.exit();
});
