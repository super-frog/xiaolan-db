const { EOL } = require('os');
const StringBuilder = require('../../utils/StringBuilder');

class Table {
  constructor(name, fields, options = []) {
    name = name.replace(/\-/g, '_');
    this.name = name;
    this.fieldSet = fields;
    this.primary = undefined;
    this.index = {};
    this.uniq = {};
    this.charset = (options && options.charset) ? options.charset : 'utf8';
    this.engine = (options && options.engine) ? options.engine : 'InnoDB';
    for (let k in fields) {
      if (fields[k].isPrimary) {
        this.primary = {
          key: k,
          fieldName: fields[k].fieldName,
        };
      }
      if (fields[k].indexName !== '') {
        this.index[fields[k].indexName] = this.index[fields[k].indexName] || [];
        this.index[fields[k].indexName].push({
          key: k,
          fieldName: fields[k].fieldName,
        });
      }

      if (fields[k].uniqIndexName !== '') {
        this.uniq[fields[k].uniqIndexName] = this.uniq[fields[k].uniqIndexName] || [];
        this.uniq[fields[k].uniqIndexName].push({
          key: k,
          fieldName: fields[k].fieldName,
        });
      }
    }
  }

  tableName() {
    return this.name;
  }

  toSQL() {
    let strings = new StringBuilder(' ');
    strings.add(`create table \`${this.name}\` (${EOL}`);

    for (let k in this.fieldSet) {
      if (this.fieldSet[k].isPrimary) {
        this.primary = this.fieldSet[k].fieldName;
      }
      strings.add([this.fieldSet[k].toString(), EOL]);
    }
    if (this.primary) {
      strings.add(`primary key (\`${this.primary}\`),${EOL}`);
    }

    let sql = strings.toString();
    sql = sql.substr(0, sql.length - 1 * (`,${EOL}`.length)) + EOL;

    sql += `)engine=${this.engine} default charset=${this.charset};${EOL}`;

    return sql;
  }

  alter(fieldKey, op = 'change') {
    let sql = '';

    switch (op) {
    case 'change':
      sql = `alter table \`${this.name}\` change \`${this.fieldSet[fieldKey].fieldName}\` ${this.fieldSet[fieldKey].toString(';')}`;
      break;
    case 'add':
      sql = `alter table \`${this.name}\` add  ${this.fieldSet[fieldKey].toString(';')}`;
      break;
    case 'drop':
      sql = `alter table \`${this.name}\` drop \`${fieldKey}\`;`;
      break;
    }

    return sql;
  }

  addIndex(indexName, fields = [], op = 'index') {
    return `alter table \`${this.name}\` add ${op} \`${indexName}\` (\`${fields.join('`,`')}\`);`;
  }

  dropIndex(indexName) {
    return `alter table \`${this.name}\` drop index \`${indexName}\`;`;
  }

  dropPrimary() {
    return `alter table \`${this.name}\` drop primary key;`;
  }
}

module.exports = Table;