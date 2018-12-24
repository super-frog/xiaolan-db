const DRIVERS = {
  mysql: require('./drivers/mysql'),
  mongo: require('./drivers/mongo'),
};

module.exports = {
  mysql: DRIVERS.mysql,
  mongo: DRIVERS.mongo,
  ... DRIVERS.mysql, // 
};