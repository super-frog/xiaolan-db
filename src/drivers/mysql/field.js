class Field {
  constructor() {
    this.fieldName = '';
    this.isAllowNull = 'NOT NULL';
    this.autoIncrease = false;
    this.isPrimary = false;
    this.defaultValue = undefined;
    this.fieldComment = '';
    this.indexName = '';
    this.uniqIndexName = '';
    this.unsigned = false;
    this.type = '';
    this.rules = [];
  }

  name(name) {
    this.fieldName = name;
    return this;
  }

  allowNull() {
    this.isAllowNull = '';
    return this;
  }

  default(value) {
    this.defaultValue = `${value}`;
    return this;
  }

  AI() {
    this.autoIncrease = true;
    return this;
  }

  primary() {
    this.isPrimary = true;
    return this;
  }

  index(indexName) {
    indexName = indexName || ((n) => `i_${n}`)(this.fieldName);
    this.indexName = indexName;
    return this;
  }

  uniq(indexName) {
    indexName = indexName || ((n) => `u_${n}`)(this.fieldName);
    this.uniqIndexName = indexName;
    return this;
  }

  comment(string) {
    this.fieldComment = string;
    return this;
  }

  tinyint(unsigned = false) {
    this.unsigned = unsigned;
    this.type = 'tinyint';
    if (unsigned) {
      this.rules = ['number', 0, 255];
    } else {
      this.rules = ['number', -128, 127];
    }
    return this;
  }

  smallint(unsigned = false) {
    this.unsigned = unsigned;
    this.type = 'smallint';
    if (unsigned) {
      this.rules = ['number', 0, 65535];
    } else {
      this.rules = ['number', -32768, 32767];
    }
    return this;
  }

  int(unsigned = false) {
    this.unsigned = unsigned;
    this.type = 'int';
    if (unsigned) {
      this.rules = ['number', 0, 4294967295];
    } else {
      this.rules = ['number', -2147483648, 2147483647];
    }
    return this;
  }

  mediumint(unsigned = false) {
    this.unsigned = unsigned;
    this.type = 'mediumint';
    if (unsigned) {
      this.rules = ['number', 0, 16777215];
    } else {
      this.rules = ['number', -8388608, 8388607];
    }
    return this;
  }

  bigint(unsigned = false) {
    this.unsigned = unsigned;
    this.type = 'bigint';
    if (unsigned) {
      this.rules = ['number', 0, Number.MAX_SAFE_INTEGER * 2];
    } else {
      this.rules = ['number', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    }
    return this;
  }

  float(l, r, unsigned = false) {
    this.unsigned = unsigned;
    this.type = `float(${l},${r})`;
    if (unsigned) {
      this.rules = ['number', 0, Number.parseFloat('9'.repeat(l) + '.' + '9'.repeat(r))];
    } else {
      this.rules = ['number', -1 * Number.parseFloat('9'.repeat(l) + '.' + '9'.repeat(r)), Number.parseFloat('9'.repeat(l) + '.' + '9'.repeat(r))];
    }
    return this;
  }

  char(len = 64) {
    this.type = 'char(' + (Number.isInteger(len) ? len : 64) + ')';
    this.rules = ['string', 0, len];
    return this;
  }

  varchar(len = 64) {
    this.type = 'varchar(' + (Number.isInteger(len) ? len : 64) + ')';
    this.rules = ['string', 0, len];
    return this;
  }

  text() {
    this.type = 'text';
    return this;
  }

  toString(endWith = ',') {
    return `\`${this.fieldName}\` ${this.type} ${this.unsigned && this.isNum() ? 'unsigned' : ''} ${this.isAllowNull} ${this.defaultValue != undefined ? `default '${this.defaultValue}'` : ''} ${this.autoIncrease ? 'auto_increment' : ''} ${this.fieldComment ? `comment '${this.fieldComment}'` : ''}${endWith}`;
  }

  isNum() {
    return ['int', 'tinyint', 'smallint', 'bigint', 'mediumint'].includes(this.type);
  }
}

module.exports = {
  name: (n) => {
    const f = new Field();
    f.name(n);
    return f;
  }
};