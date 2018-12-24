class StringBuilder {
  constructor(separator = ' ') {
    this.separator = separator;
    this.buffer = [];
  }

  add(str) {
    if (Array.isArray(str)) {
      for (let k in str) {
        this.buffer.push(str[k]);
      }
    } else {
      this.buffer.push(str);
    }
    return this.buffer.length;
  }

  toString() {
    return this.buffer.join(this.separator);
  }

  cap() {
    return this.buffer.length;
  }
}

module.exports = StringBuilder;
