const mongoose = require('mongoose');
const Connection = require('./connection');
const Presets = require('./presets');
const unify = require('./unify');

class MongooseTransfer {
  constructor(name, definition) {
    if (!name) {
      throw new Error('Model MUST have a name!');
    }
    this.definition = definition;
    this.unify = unify(definition);
    this.schema = new mongoose.Schema(this.unify);
    this.schema.plugin(Presets);
    this.model = mongoose.model(name, this.schema);
  }


}



module.exports = (definition, name) => {
  require('./connection');
  const MT = new MongooseTransfer(definition, name);

  return new Proxy(MT, {
    get(target, propertyKey, receiver) {
      console.log(propertyKey);
      if (target[propertyKey]){
        return target[propertyKey];
      }
      return target.model[propertyKey] || null;
    }
  });
};