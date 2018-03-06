'use strict';
const Field = require('./Field');
const AI = {
  id: Field.name('id').bigint(true).primary().AI().comment('primary id'),
};

const opTime = {
  createTime: Field.name('create_time').bigint(true).index(),
  updateTime: Field.name('update_time').bigint(true).index(),
};

module.exports = {
  AI,
  opTime,
};