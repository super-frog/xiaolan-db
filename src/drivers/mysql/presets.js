const Field = require('./field');
const AI = {
  id: Field.name('id').bigint(true).primary().AI().comment('数据主键'),
};

const opTime = {
  createTime: Field.name('create_time').bigint(true).index().comment('创建时间'),
  updateTime: Field.name('update_time').bigint(true).index().comment('更新时间'),
};

module.exports = {
  AI,
  opTime,
};