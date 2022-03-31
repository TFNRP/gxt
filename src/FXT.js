const { Buffer } = require('node:buffer');

/**
 * API for Fake Text Table format.
 * Does not discard the last read entry.
 * @param {Buffer|string} [data]
 */
function FXT(data) {
  if (this instanceof FXT) {
    /** @private */
    this._map = new Map();

    if (data) {
      if (!(typeof data === 'string' || Buffer.isBuffer(data))) {
        throw new TypeError(`data must be type of string or Buffer, got "${typeof data}"`);
      }

      const buffer = Buffer.from(data);

      // FXT encrypts the first 8 bytes, sequence to decrypt:
      buffer.writeUInt32LE(buffer.readUInt32LE(0) - 0x63, 0);
      buffer.writeUInt32LE(buffer.readUInt32LE(1) - 0xC6, 1);
      buffer.writeUInt32LE(buffer.readUInt32LE(2) - 0x8C, 2);
      buffer.writeUInt32LE(buffer.readUInt32LE(3) - 0x18, 3);
      buffer.writeUInt32LE(buffer.readUInt32LE(4) - 0x30, 4);
      buffer.writeUInt32LE(buffer.readUInt32LE(5) - 0x60, 5);
      buffer.writeUInt32LE(buffer.readUInt32LE(6) - 0xC0, 6);
      buffer.writeUInt32LE(buffer.readUInt32LE(7) - 0x7F, 7);

      for (const i of buffer.keys()) {
        buffer.writeUInt8(buffer.readUInt8(i) - 1, i);
      }

      // build string
      let curNameStart = 0;
      let curNameEnd = 0;
      for (let i = 0; i <= buffer.length; i++) {
        const char = buffer[i];
        switch (char) {
          case undefined:
          case 0:
            // table is null-terminated, set cur and continue
            const name = buffer.slice(curNameStart, curNameEnd).toString();
            const desc = buffer.slice(curNameEnd + 1, i).toString();
            this._map.set(name, desc);
            curNameStart = 0;
            curNameEnd = 0;
            break;
          case 0x5B: // '['
            if (!curNameStart) {
              curNameStart = i + 1;
            }
            break;
          case 0x5D: // ']'
            if (curNameStart && !curNameEnd) {
              curNameEnd = i;
            }
            break;
        }
      }
    }
  } else {
    return new FXT(data);
  }
}

/**
 * @returns {{ [k: string]: string }}
 */
FXT.prototype.toJSON = function () {
  return Object.fromEntries(this._map.entries());;
}

/**
 * Exports this Fake Text Table back into it's machine-readable format.
 * @returns {Buffer}
 */
FXT.prototype.export = function () {
  const entries = [];
  for (const [key, value] of this._map.entries()) {
    entries.push(`[${key}]${value}`);
  }

  const buffer = Buffer.from(entries.join('\x00'));

  // re-encryot
  buffer.writeUInt32LE(buffer.readUInt32LE(0) + 0x63, 0);
  buffer.writeUInt32LE(buffer.readUInt32LE(1) + 0xC6, 1);
  buffer.writeUInt32LE(buffer.readUInt32LE(2) + 0x8C, 2);
  buffer.writeUInt32LE(buffer.readUInt32LE(3) + 0x18, 3);
  buffer.writeUInt32LE(buffer.readUInt32LE(4) + 0x30, 4);
  buffer.writeUInt32LE(buffer.readUInt32LE(5) + 0x60, 5);
  buffer.writeUInt32LE(buffer.readUInt32LE(6) + 0xC0, 6);
  buffer.writeUInt32LE(buffer.readUInt32LE(7) + 0x7F, 7);

  for (const i of buffer.keys()) {
    buffer.writeUInt8(buffer.readUInt8(i) + 1, i);
  }

  return buffer;
}

// shortcuts
Object.defineProperty(FXT.prototype, 'size', {
  get: function () {
    return this._map.size;
  },
})

FXT.prototype.get = function (key) {
  return this._map.get(key);
}

FXT.prototype.has = function (key) {
  return this._map.has(key);
}

/**
 * Set a key to a value
 * @param {string} key - The description's "hash" key
 * @param {string} value - The description to set
 * @returns {this}
 */
FXT.prototype.set = function (key, value) {
  this._map.set(key, value);
  return this;
}

FXT.prototype.clear = function () {
  return this._map.clear();
}

FXT.prototype.delete = function (key) {
  return this._map.delete(key);
}

FXT.prototype.entries = function () {
  return this._map.entries();
}

FXT.prototype.keys = function () {
  return this._map.keys();
}

FXT.prototype.values = function () {
  return this._map.values();
}

FXT.prototype.forEach = function (callbackFn, thisArg) {
  return this._map.forEach(callbackFn, thisArg);
}

FXT.prototype[Symbol.iterator] = function () {
  return this._map[Symbol.iterator]();
}

module.exports = FXT;