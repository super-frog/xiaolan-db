const { Table, Field, Migrate, Presets } = require('../src/index');

const DB_CONF = {
  DB_HOST: '172.20.160.7',
  DB_PORT: 3306,
  DB_USER: 'root',
  DB_PASSWORD: 'mysqlpsw',
  DB_NAME: 'test'
};

const tableDemo = new Table('table_demo',{
  ...Presets.AI,
  name: Field.name('demo_name').char(32).uniq().comment('名字'),
  age: Field.name('demo_age').smallint(true).index('i_age').default(99).comment('年龄'),
  ...Presets.opTime,
});

const M = new Migrate(DB_CONF);

M.execute(tableDemo)
  .then(v=>{
    console.log(v);
    process.exit();
  })
  .catch(e=>{
    console.error(e);
    process.exit(-1);
  });