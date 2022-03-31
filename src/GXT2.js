const { Buffer } = require('node:buffer');
const { invalidHashError, isValidUint32, joaat } = require('./util');

const TAG = '2TXG';
const SIZE_COUNTER_BYTE = 4;

/** @typedef {import('./util').HashLike} HashLike */

// maybe GXT2Reader and GXT2Map for preferred reading/writing would be better
// this spec is slower at writing than a usual map but faster at reading

/**
 * API for GTA 5 text format.
 * @param {Buffer|string} data
 * @namespace GXT2
 */
function GXT2(data) {
  if (this instanceof GXT2) {
    if (!(typeof data === 'string' || Buffer.isBuffer(data))) {
      throw new TypeError(`data must be type of string or Buffer, got "${typeof data}"`);
    }

    this.buffer = Buffer.from(data);

    if (!this._isValid()) throw new Error('Invalid GXT2');
  } else {
    return new GXT2(data);
  }
}

Object.defineProperty(GXT2.prototype, 'size', {
  get: function () {
    return this.buffer.readUInt32LE(SIZE_COUNTER_BYTE);
  },
});

Object.defineProperty(GXT2.prototype, '_dataBlockAt', {
  get: function () {
    return (this.size + 2) * 8;
  },
});

Object.defineProperty(GXT2.prototype, '_eofOffsetByte', {
  get: function () {
    return (this.size + 1) * 8 + 4;
  },
});

GXT2.prototype._isValid = function () {
  if (this.buffer.slice(0, 4).toString() !== TAG) return false;
  const descHeaderAt = (this.size + 1) * 8;

  if (this.buffer.slice(descHeaderAt, descHeaderAt + 4).toString() !== TAG) return false;
  if (this.buffer.readUInt32LE(descHeaderAt + 4) !== this.buffer.length) return false;

  return true;
}

GXT2.prototype._findNullTerminator = function (start) {
  for (let i = start; i < this.buffer.length; i++) {
    if (this.buffer[i] === 0) return i;
  }

  throw new Error('Null terminator not found. GXT2 is possibly corrupt.');
}

GXT2.prototype._sliceData = function (start) {
  return this.buffer.slice(start, this._findNullTerminator(start));
}

/**
 * Check if this hash key exists
 * @param {HashLike} hash
 * @return {boolean}
 */
GXT2.prototype.has = function (hash) {
  if (typeof hash === 'string') hash = joaat(hash);
  if (!isValidUint32(hash)) throw invalidHashError(hash);

  for (let i = 1; i <= this.size; i++) {
    if (this.buffer.readUInt32LE(i * 8) === hash) return true;
  }

  return false;
}

/**
 * Get the hash description from hash key
 * @param {HashLike} hash
 * @return {string}
 */
GXT2.prototype.get = function (hash) {
  if (typeof hash === 'string') hash = joaat(hash);
  if (!isValidUint32(hash)) throw invalidHashError(hash);

  for (let i = 1; i <= this.size; i++) {
    const hashAt = i * 8;

    if (this.buffer.readUInt32LE(hashAt) === hash) {
      const offsetAt = hashAt + 4;
      const entryPos = this.buffer.readUInt32LE(offsetAt);

      return this._sliceData(entryPos).toString();
    }
  }
}

/**
 * Set the hash description from hash key
 * @param {HashLike} hash - The hash key
 * @param {string} description - The description to set the hash key as
 * @return {GXT2}
 */
GXT2.prototype.set = function (hash, description) {
  if (typeof hash === 'string') hash = joaat(hash);
  if (!isValidUint32(hash)) throw invalidHashError(hash);
  const descBuffer = Buffer.from(description);

  // check if this already exists
  for (let i = 1; i <= this.size; i++) {
    const hashByte = i * 8;
    if (this.buffer.readUInt32LE(hashByte) === hash) {
      const offsetByte = hashByte + 4;
      const entryStart = this.buffer.readUInt32LE(offsetByte);
      const entryEnd = this._findNullTerminator(entryStart);
      const previousDescLength = entryEnd - entryStart;
      const offsetDiff = descBuffer.length - previousDescLength;
      const buf = Buffer.concat([
        this.buffer.slice(0, entryStart),
        descBuffer,
        this.buffer.slice(entryEnd),
      ]);

      // update next offset positions
      // loop this 1 more time to include EOF offset
      for (i++; i <= this.size + 1; i++) {
        const nextHashByte = i * 8;
        const nextOffsetByte = nextHashByte + 4;
        buf.writeUInt32LE(buf.readUInt32LE(nextOffsetByte) + offsetDiff, nextOffsetByte)
      }

      this.buffer = buf;
      return this;
    }
  }

  // find the correct position to add this hash
  for (let i = 1; i <= this.size + 1; i++) {
    const hashByte = i * 8;
    const isEof = i === this.size + 1;
    if (this.buffer.readUInt32LE(hashByte) > hash || isEof) {
      const descOffsetByte = hashByte + 4;
      const hashUint32 = Buffer.alloc(4);
      hashUint32.writeUInt32LE(hash);
      // copy from the next desc offset, all next desc offsets will be incremented
      const descOffsetUint32 = this.buffer.slice(descOffsetByte, descOffsetByte + 4);
      // EOF offset points to null term instead of start, so add 1
      if (isEof) descOffsetUint32.writeUInt32LE(descOffsetUint32.readUInt32LE() + 1);
      const descOffsetPos = descOffsetUint32.readUInt32LE();
      const addedLength = descBuffer.length + 1;
      const buf = Buffer.concat([
        this.buffer.slice(0, hashByte),
        hashUint32,
        descOffsetUint32,
        this.buffer.slice(hashByte, descOffsetPos),
        descBuffer,
        Buffer.alloc(1),
        this.buffer.slice(descOffsetPos),
      ]);

      // increment size counter
      const size = this.size + 1;
      buf.writeUInt32LE(size, SIZE_COUNTER_BYTE);

      // increment all offset positions by the amount of new key bytes added
      for (let i = 1; i <= size + 1; i++) {
        const nextHashAt = i * 8;
        const nextOffsetAt = nextHashAt + 4;
        buf.writeUInt32LE(buf.readUInt32LE(nextOffsetAt) + 8, nextOffsetAt)
      }

      // add new length to next offset positions
      for (i++; i <= size + 1; i++) {
        const nextHashAt = i * 8;
        const nextOffsetAt = nextHashAt + 4;
        buf.writeUInt32LE(buf.readUInt32LE(nextOffsetAt) + addedLength, nextOffsetAt)
      }

      this.buffer = buf;
      return this;
    }
  }
}

/**
 * Deletes this entry
 * @param {HashLike} hash - The hash key of the entry to delete
 * @returns {boolean} Whether the hash key exists and has been removed
 */
GXT2.prototype.delete = function (hash) {
  if (typeof hash === 'string') hash = joaat(hash);
  if (!isValidUint32(hash)) throw invalidHashError(hash);

  for (let i = 1; i <= this.size; i++) {
    const hashByte = i * 8;
    if (this.buffer.readUInt32LE(hashByte) === hash) {
      const offsetByte = hashByte + 4;
      const entryStart = this.buffer.readUInt32LE(offsetByte);
      const entryEnd = this._findNullTerminator(entryStart);
      const nextHashByte = hashByte + 8;
      const removedDataLength = entryEnd - entryStart + 1;
      const buf = Buffer.concat([
        this.buffer.slice(0, hashByte),
        this.buffer.slice(nextHashByte, entryStart),
        this.buffer.slice(entryEnd + 1)
      ]);

      // decrement size counter bytes
      const size = this.size - 1;
      buf.writeUInt32LE(size, SIZE_COUNTER_BYTE);

      // decrement all offset positions by the amount of bytes removed
      for (let i = 1; i <= size + 1; i++) {
        const nextHashAt = i * 8;
        const nextOffsetAt = nextHashAt + 4;
        buf.writeUInt32LE(buf.readUInt32LE(nextOffsetAt) - 8, nextOffsetAt)
      }

      // subtract removed data length from next offset positions
      // next offset starts at i because we've already removed this hash
      for (; i <= size + 1; i++) {
        const nextHashAt = i * 8;
        const nextOffsetAt = nextHashAt + 4;
        buf.writeUInt32LE(buf.readUInt32LE(nextOffsetAt) - removedDataLength, nextOffsetAt)
      }

      this.buffer = buf;
      return true;
    }
  }

  return false;
}

/**
 * Deletes all hashes
 * @returns {void}
 */
GXT2.prototype.clear = function () {
  const header = Buffer.from(TAG);
  this.buffer = Buffer.concat([
    header,
    Buffer.alloc(4),
    header,
    Buffer.from([16]),
  ], 16);
}

/**
 * Combines this table with other tables
 * @param  {...GXT2} tables
 * @returns {GXT2}
 */
GXT2.prototype.concat = function () {
  for (const table of arguments) {
    for (const [key, value] of table.entries()) {
      this.set(key, value);
    }
  }

  return this;
}

/**
 * Get the hash key of the item at index
 * @param {number} [index] 
 * @returns {number} The hash key found, if any
 */
GXT2.prototype.keyAt = function (index) {
  if (typeof index !== 'number') index = 0;
  if (index < 0) index = this.size - index;
  const hashAt = index * 8;
  const offsetAt = hashAt + 4;
  const entryStart = this.buffer.readUInt32LE(offsetAt);

  // make sure this isn't the EOF offset
  if (entryStart !== this.buffer.length) return this.buffer.readUInt32LE(hashAt);
}

/**
 * Get the hash value of the item at index
 * @param {number} [index] 
 * @returns {string} The hash value found, if any
 */
GXT2.prototype.at = function (index) {
  if (typeof index !== 'number') index = 0;
  if (index < 0) index = this.size - index;
  const hashAt = index * 8;
  const offsetAt = hashAt + 4;
  const entryStart = this.buffer.readUInt32LE(offsetAt);

  if (entryStart !== this.buffer.length) return this._sliceData(entryStart).toString();
}

/**
 * Get the first hash value(s).
 * @param {number} [amount]
 * @returns {string|string[]} The hash value(s) found, if any
 */
GXT2.prototype.first = function (amount) {
  if (typeof amount !== 'number') return this.at();
  const results = [];

  for (let i = 0; i < Math.abs(amount); i++) {
    if (i > this.size) break;
    const hashAt = (amount - i) * 8;
    const offsetAt = hashAt + 4;
    const entryStart = this.buffer.readUInt32LE(offsetAt);

    if (entryStart !== this.buffer.length) {
      results.push(this._sliceData(entryStart).toString());
    }
  }

  return results;
}

/**
 * Get the first hash key(s).
 * @param {number} [amount]
 * @returns {number|number[]} The hash key(s) found, if any
 */
GXT2.prototype.firstKey = function (amount) {
  if (typeof amount !== 'number') return this.keyAt();
  const results = [];

  for (let i = 0; i < Math.abs(amount); i++) {
    if (i > this.size) break;
    const hashAt = (amount - i) * 8;
    const offsetAt = hashAt + 4;
    const entryStart = this.buffer.readUInt32LE(offsetAt);

    if (entryStart !== this.buffer.length) {
      results.push(this.buffer.readUInt32LE(hashAt));
    }
  }

  return results;
}

/**
 * Get the last hash value(s).
 * @param {number} [amount]
 * @returns {string|string[]} The hash value(s) found, if any
 */
GXT2.prototype.last = function (amount) {
  if (typeof amount === 'number') amount = -amount
  return this.first(amount);
}

/**
 * Get the last hash key(s).
 * @param {number} [amount]
 * @returns {number|number[]} The hash key(s) found, if any
 */
GXT2.prototype.lastKey = function (amount) {
  if (typeof amount === 'number') amount = -amount
  return this.firstKey(amount);
}

/**
 * Iterates hash keys and hash values in size order.
 * @return {IterableIterator<[number, string]>}
 */
GXT2.prototype.entries = GXT2.prototype[Symbol.iterator] = function* () {
  for (let i = 1; i <= this.size; i++) {
    const hashAt = i * 8;
    const offsetAt = hashAt + 4;
    const entryStart = this.buffer.readUInt32LE(offsetAt);
    const hash = this.buffer.readUInt32LE(hashAt);

    yield [hash, this._sliceData(entryStart).toString()];
  }
}

/**
 * Iterates hash values in size order.
 * @return {IterableIterator<string>}
 */
GXT2.prototype.values = function* () {
  for (let i = 1; i <= this.size; i++) {
    const hashAt = i * 8;
    const offsetAt = hashAt + 4;
    const entryStart = this.buffer.readUInt32LE(offsetAt);

    yield this._sliceData(entryStart).toString();
  }
}

/**
 * Iterates hash keys in size order.
 * @return {IterableIterator<number>}
 */
GXT2.prototype.keys = function* () {
  for (let i = 1; i <= this.size; i++) {
    yield this.buffer.readUInt32LE(i * 8);
  }
}

/**
 * @param {(description: string, hash: number, gxt2: GXT2) => any} callbackFn
 * @param {any} thisArg 
 */
GXT2.prototype.forEach = function (callbackFn, thisArg) {
  for (const [hash, description] of this.entries()) {
    callbackFn.call(thisArg, description, hash, this);
  }
}

/**
 * @returns {{ [k: string]: string }}
 */
GXT2.prototype.toJSON = function () {
  return Object.fromEntries(this.entries());
}

module.exports = GXT2;