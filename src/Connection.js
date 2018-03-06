/**
 * Created by lanhao on 2017/9/17.
 */

'use strict';
const mysql = require('fy-mysql');

class Connection {
  constructor(config) {
    this.config = config;
    if (!(this.config.DB_HOST && this.config.DB_PORT && this.config.DB_USER && this.config.DB_PASSWORD && this.config.DB_NAME)) {
      throw new Error('check database config');
    }
    this.conn = mysql.create({
      'maxconnections': 10
    });
    this.conn.addserver({
      host: this.config.DB_HOST,
      user: this.config.DB_USER,
      port: this.config.DB_PORT,
      password: this.config.DB_PASSWORD + '',
      database: this.config.DB_NAME
    });
  }
}

const Pool = new Map();

module.exports = (cid = 'default', config = null) => {
  if (config === null) {
    config = {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME
    };
    Pool.set(cid, new Connection(config));
  }
  if (!Pool.has(cid)) {
    Pool.set(cid, new Connection(config));
  }
  return Pool.get(cid);
};