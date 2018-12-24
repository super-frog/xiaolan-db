const TYPE_MAP = {
  string: String,
  number: Number,

};

const unify = obj => {
  if(typeof obj !== 'object'){
    return TYPE_MAP[typeof obj];
  }
  const output = {};
  for (let k in obj) {
    const field = obj[k];
    const type = typeof field;
    const mongooseType = TYPE_MAP[type];
    if (!mongooseType) {
      if (field.type) {
        // mongoose的标准形式
        output[k] = field;
      } else if (type === 'object' && Array.isArray(field)) {
        // 是个数组

        if (field[0]) {
          output[k] = [
            unify(field[0]),
          ];
        }else{
          output[k] = Array;
        }
      }else{
        output[k] = unify(field);
      }
      continue;
    }
    output[k] = {
      type: mongooseType,
      default: field,
    };
  }
  return output;
};

module.exports = unify;