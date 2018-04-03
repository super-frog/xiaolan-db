/**
 * Created by lanhao on 2017/8/25.
 */

'use strict';

const mysql = require('fy-mysql');
const StringBuilder = require('./StringBuilder');
const Connection = require('./Connection');

class Migrate {
  constructor(config = null) {
    //todo 多路连接
    this.dbConfig = config || {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME
    };
    this.conn = Connection('migrate', this.dbConfig).conn;
  }

  setConn(conn) {
    if (conn.constructor.name === 'Cluster') {
      this.conn = conn;
    } else {
      throw new Error('Invalid Conn!');
    }
  }

  async execute(tableInstance) {
    let conn = this.conn;

    let schema = await this.getTableSchema(tableInstance.tableName());
    let isNew = false;
    if (schema.length === 0) {
      //create table
      isNew = true;
      await new Promise((resolved, rejected) => {
        conn.query(tableInstance.toSQL(), (e, r) => {
          if (e) {
            rejected('query error! ' + e.toString());
          } else {
            resolved(r);
          }
        })
      });
    } else {
      //alter table
      let schemaObject = {};
      let diffSQL = new StringBuilder();

      for (let k in schema) {

        schemaObject[schema[k]['COLUMN_NAME']] = {
          fieldName: schema[k]['COLUMN_NAME'],
          type: schema[k]['DATA_TYPE'] + ((!['tinyint', 'smallint', 'int', 'mediumint', 'bigint'].includes(schema[k]['DATA_TYPE'])) ? `(${schema[k]['CHARACTER_MAXIMUM_LENGTH'] || schema[k]['NUMERIC_PRECISION'] + ',' + schema[k]['NUMERIC_SCALE']})` : ''),
          unsigned: schema[k]['COLUMN_TYPE'].includes('unsigned'),
          isAllowNull: schema[k]['IS_NULLABLE'] === 'NO' ? 'NOT NULL' : '',
          defaultValue: schema[k]['COLUMN_DEFAULT'] || undefined,
          autoIncrease: schema[k]['EXTRA'].includes('auto_increment'),
          fieldComment: schema[k]['COLUMN_COMMENT'] || ''
        };

      }

      let diff = this.diffTable(tableInstance.fieldSet, schemaObject);

      if (diff.flag) {
        let emergencySQL = new StringBuilder();
        for (let k in diff.fields.drop) {
          diffSQL.add(tableInstance.alter(diff.fields.drop[k], 'drop'));
        }
        for (let k in diff.fields.change) {
          if (tableInstance.fieldSet[diff.fields.change[k]].autoIncrease === true) {
            let hasPrimary = await this.hasPrimary(tableInstance.tableName());
            if (hasPrimary.length) {
              emergencySQL.add(tableInstance.alter(diff.fields.change[k], 'change').replace('auto_increment', ''));
              emergencySQL.add(tableInstance.dropPrimary());
            }
            emergencySQL.add(tableInstance.addIndex('', [tableInstance.fieldSet[diff.fields.change[k]].fieldName], 'primary key'));
            emergencySQL.add(tableInstance.alter(diff.fields.change[k], 'change'));
          } else {
            diffSQL.add(tableInstance.alter(diff.fields.change[k], 'change'));
          }
        }
        for (let k in diff.fields.add) {
          if (tableInstance.fieldSet[diff.fields.add[k]].autoIncrease === true) {
            let hasPrimary = await this.hasPrimary(tableInstance.tableName());
            if (hasPrimary.length) {
              emergencySQL.add(tableInstance.dropPrimary());
            }
            tableInstance.fieldSet[diff.fields.add[k]].autoIncrease = false;
            emergencySQL.add(tableInstance.alter(diff.fields.add[k], 'add'));
            emergencySQL.add(tableInstance.addIndex('', [tableInstance.fieldSet[diff.fields.add[k]].fieldName], 'primary key'));
            tableInstance.fieldSet[diff.fields.add[k]].autoIncrease = true;
            emergencySQL.add(tableInstance.alter(diff.fields.add[k], 'change'));

          } else {
            diffSQL.add(tableInstance.alter(diff.fields.add[k], 'add'));
          }
        }

        for (let k in emergencySQL.buffer) {
          await new Promise((resolved, rejected) => {
            conn.query(emergencySQL.buffer[k], (e, r) => {
              if (e) {
                rejected('emergency query error!' + e.toString());
              } else {
                resolved(r)
              }
            });
          });
        }

        if (diffSQL.cap()) {
          for (let k in diffSQL.buffer) {
            await new Promise((resolved, rejected) => {
              conn.query(diffSQL.buffer[k], (e, r) => {
                if (e) {
                  rejected('query error!' + e.toString());
                } else {
                  resolved(r)
                }
              });
            });
          }
        }
      }
    }

    //alter index
    let indexesSQL = new StringBuilder();
    let indexes = await this.getIndex(tableInstance.tableName());
    let indexDB = {
      'index': {},
      'uniq': {},
      'primary': {}
    };
    let indexTypeMap = {
      '0': 'index',
      '1': 'locked',
      '2': 'uniq',
      '3': 'primary'
    };
    for (let k in indexes) {
      indexDB[indexTypeMap[indexes[k]['TYPE']]][indexes[k]['NAME']] = indexDB[indexTypeMap[indexes[k]['TYPE']]][indexes[k]['NAME']] || [];
      indexDB[indexTypeMap[indexes[k]['TYPE']]][indexes[k]['NAME']].push(indexes[k]['fieldName']);
    }

    let indexSchema = {
      'index': {},
      'uniq': {},
      'primary': {
        'PRIMARY': []
      }
    };

    for (let k in tableInstance.fieldSet) {
      if (tableInstance.fieldSet[k]['indexName'] !== '') {
        indexSchema.index[tableInstance.fieldSet[k]['indexName']] = indexSchema.index[tableInstance.fieldSet[k]['indexName']] || [];
        indexSchema.index[tableInstance.fieldSet[k]['indexName']].push(tableInstance.fieldSet[k].fieldName);
      }
      if (tableInstance.fieldSet[k]['uniqIndexName'] !== '') {
        indexSchema.uniq[tableInstance.fieldSet[k]['uniqIndexName']] = indexSchema.uniq[tableInstance.fieldSet[k]['uniqIndexName']] || [];
        indexSchema.uniq[tableInstance.fieldSet[k]['uniqIndexName']].push(tableInstance.fieldSet[k].fieldName);
      }
      if (tableInstance.fieldSet[k]['isPrimary']) {
        indexSchema.primary.PRIMARY.push(tableInstance.fieldSet[k].fieldName);
      }
    }


    for (let k in indexDB.index) {
      if (indexSchema.index[k] === undefined || (JSON.stringify(indexSchema.index[k]) !== JSON.stringify(indexDB.index[k]))) {
        indexesSQL.add(tableInstance.dropIndex(k));
      }
    }
    for (let k in indexSchema.index) {
      if (indexDB.index[k] === undefined || JSON.stringify(indexSchema.index[k]) !== JSON.stringify(indexDB.index[k])) {
        indexesSQL.add(tableInstance.addIndex(k, indexSchema.index[k]));
      }
    }
    for (let k in indexDB.uniq) {
      if (indexSchema.uniq[k] === undefined || (JSON.stringify(indexSchema.uniq[k]) !== JSON.stringify(indexDB.uniq[k]))) {
        indexesSQL.add(tableInstance.dropIndex(k));
      }
    }
    for (let k in indexSchema.uniq) {
      if (indexDB.uniq[k] === undefined || JSON.stringify(indexSchema.uniq[k]) !== JSON.stringify(indexDB.uniq[k])) {
        indexesSQL.add(tableInstance.addIndex(k, indexSchema.uniq[k], 'unique index'));
      }
    }

    if (!isNew && JSON.stringify(indexDB.primary.PRIMARY) !== JSON.stringify(indexSchema.primary.PRIMARY)) {
      (indexDB.primary.PRIMARY && indexDB.primary.PRIMARY.length) && indexesSQL.add(tableInstance.dropPrimary());
      indexSchema.primary.PRIMARY.length && indexesSQL.add(tableInstance.addIndex('', indexSchema.primary.PRIMARY, 'primary key'));
    }

    if (indexesSQL.cap()) {
      for (let k in indexesSQL.buffer) {
        let sql = indexesSQL.buffer[k];
        await new Promise((resolved, rejected) => {
          conn.query(sql, (e, r) => {
            if (e) {
              rejected('query error!  ' + e.toString());
            } else {
              resolved(r);
            }
          });
        });
      }

    }
    return 'done';

  }

  async getTableSchema(tableName) {
    let conn = this.conn;
    let config = this.dbConfig;
    return await new Promise((resolved, rejected) => {
      conn.query(`select * from information_schema.COLUMNS where TABLE_SCHEMA="${config.DB_NAME}" and TABLE_NAME="${tableName}"`, (e, r) => {
        if (e) {
          rejected('query error!' + e.toString());
        } else {
          resolved(r);
        }
      });
    });
  }

  async getIndex(tableName) {
    let conn = this.conn;
    let config = this.dbConfig;
    return await new Promise((resolved, rejected) => {
      conn.query(`select t1.*,t2.NAME fieldName from information_schema.INNODB_SYS_INDEXES t1 right join information_schema.INNODB_SYS_FIELDS t2  on t1.INDEX_ID=t2.INDEX_ID  where  TABLE_ID=(select TABLE_ID from information_schema.INNODB_SYS_TABLES where name="${config.DB_NAME}/${tableName}")`, (e, r) => {
        if (e) {
          rejected('query error!' + e.toString());
        } else {
          resolved(r);
        }
      });
    });
  }

  async hasPrimary(tableName) {
    let conn = this.conn;
    let config = this.dbConfig;
    return await new Promise((resolved, rejected) => {
      conn.query(`select t1.*,t2.NAME fieldName from information_schema.INNODB_SYS_INDEXES t1 right join information_schema.INNODB_SYS_FIELDS t2  on t1.INDEX_ID=t2.INDEX_ID  where t1.TYPE=3 and TABLE_ID=(select TABLE_ID from information_schema.INNODB_SYS_TABLES where name="${config.DB_NAME}/${tableName}")`, (e, r) => {
        if (e) {
          rejected('query error!' + e.toString());
        } else {
          resolved(r);
        }
      });
    });
  }

  diffTable(tableSchema, tableDB) {
    let result = {
      flag: false,
      fields: {
        'add': [],
        'change': [],
        'drop': []
      }
    };
    for (let k in tableSchema) {
      if (tableDB[tableSchema[k].fieldName] === undefined) {
        result.flag = true;
        result.fields.add.push(k);
      } else {
        tableDB[tableSchema[k].fieldName].notGhost = true;
        if (Migrate.diff(tableSchema[k], tableDB[tableSchema[k].fieldName])) {
          result.flag = true;
          result.fields.change.push(k);
        }
      }
    }
    for (let k in tableDB) {
      if (tableDB[k].notGhost === undefined) {
        result.flag = true;
        result.fields.drop.push(k);
      }
    }
    return result;
  }

  static diff(fieldScheme, fieldDB) {

    if (!(fieldScheme && fieldDB)) {
      return true;
    }
    let flag = false;

    for (let k in fieldScheme) {
      if (['indexName', 'uniqIndexName', 'isPrimary', 'rules'].includes(k)) {
        continue;
      }

      if (fieldScheme.rules[0] === 'number' && k === 'defaultValue') {
        fieldScheme[k] = (fieldScheme[k] !== undefined) ? Number.parseFloat(fieldScheme[k]) : fieldScheme[k];
        fieldDB[k] = (fieldDB[k] !== undefined) ? Number.parseFloat(fieldDB[k]) : fieldDB[k];
      }

      flag = flag || (fieldScheme[k] !== fieldDB[k]);
      if (flag) {
        break;
      }
    }
    return flag;
  }

}

module.exports = Migrate;

