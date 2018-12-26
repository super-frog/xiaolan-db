/**
 * 把一个对象转化为mongoose模型
 */
const mongoose = require('mongoose');

const Presets = require('./presets');
const unify = require('./unify');
require('./connection');

class MongooseTransfer {
  constructor(definition, name) {
    if (!name) {
      throw new Error('Model MUST have a name!');
    }
    this._definition = definition;
    this._unify = unify(definition);
    this._schema = new mongoose.Schema(this._unify);
    this._schema.plugin(Presets);
    this._model = mongoose.model(name, this._schema);
  }
}

module.exports = (definition, name) => {
  const MT = new MongooseTransfer(definition, name);

  return new Proxy(MT, {
    get(target, propertyKey, receiver) {
      if (target[propertyKey]) {
        if (typeof target[propertyKey] === 'function'){
          return target[propertyKey].bind(target);
        }
        return target[propertyKey];
      }
      if(typeof target._model[propertyKey] === 'function'){
        return target._model[propertyKey].bind(target._model) || null;
      }
      return target._model[propertyKey];
    }
  });
};