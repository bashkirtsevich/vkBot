'use strict';
let fs = require('fs');

module.exports = {
  data: {},
  file: '',
  open: function(filename) {
    try {
      this.data = JSON.parse(fs.readFileSync(`./data/${filename}.json`));
      this.file = filename;
    } catch(e) {
      console.log(e);
    }
    return this;
  },
  read: function(field) {
    if(field !== undefined) {
      let keys = field.split('->'), data = this.data;
      for(let key of keys) {
        if(key in data)
          data = data[key];
        else
          return null;
      }
      return data;
    } else {
      return this.data;
    }
  },
  write: function(field, value) {
    try {
      let write = JSON.stringify(this.data, (key, val) => {
        if (key == field) return value;
        return val;
      }, 2);
      fs.writeFileSync(`./data/${this.file}.json`, write);
      this.open(this.file);
    } catch(e) {
      console.log(e);
    }
  }
}
