module.exports = (schema) => {
  schema.add({
    // 创建时间
    createdAt: {
      type: Number,
      default: Date.now
    },
    // 修改时间
    updatedAt: {
      type: Number,
      default: Date.now
    },
  });
  schema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
};
