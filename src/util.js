const { XMLParser } = require('fast-xml-parser');
const fs = require('node:fs');
const { join } = require('node:path');

/**
 * Hash key. Type of string or uint32
 * @typedef HashLike
 * @type {string|number|bigint}
 */

const xmlParser = new XMLParser();

function invalidHashError(hash) {
  const e = new RangeError('Hash must be >= 0 and <= 4294967295. Received ' + hash);
  e.code = 'ERR_OUT_OF_RANGE';
  return e;
}

function invalidKeyError(key) {
  const e = new RangeError('Key must be of length >= 1 and < 8. Received ' + key);
  e.code = 'ERR_OUT_OF_RANGE';
  return e;
}

function validateBufferLength(buffer, gt, lt) {
  if (buffer.length < gt || buffer.length > lt)
    throw new RangeError(`Key must be of length >= ${gt} and <= ${lt}. Received ${buffer.toString()}`);
}

function isValidUint32(number) {
  return number >= 0 && number <= 0xFFFFFFFF;
}

function isValidUint8String(string) {
  return string.length >= 1 && string <= 8;
}

function joaat(key) {
  key = key.toLowerCase();

  const hash = new Uint32Array(1);

  for (const i in key) {
    hash[0] += key.charCodeAt(i);
    hash[0] += hash[0] << 10;
    hash[0] ^= hash[0] >>> 6;
  }

  hash[0] += hash[0] << 3;
  hash[0] ^= hash[0] >>> 11;
  hash[0] += hash[0] << 15;

  return hash[0];
}

/**
 * @param {import('./GXT2')} gxt2
 * @param {string|object} meta
 * @returns {{ [k: number]: string }}
 */
function getLabelsFromMeta(gxt2, meta) {
  if (typeof meta === 'string') meta = xmlParser.parse(meta);
  const found = {};

  for (const [mounter, mounterNode] of Object.entries(meta)) {
    switch (mounter) {
      case ('CVehicleModelInfoVarGlobal'): {
        const kits = mounterNode.Kits;
        if (Array.isArray(kits))
          for (const kit of kits) {
            const item = kit.Item;
            const mods = item.visibleMods;
            if (Array.isArray(mods))
              for (const mod of mods) {
                const item = mod.Item;
                const label = item.modShopLabel;
                if (typeof label === 'string') {
                  const hash = joaat(label);
                  if (gxt2.has(hash)) found[hash] = label;
                }
              }
          }
        break;
      }

      case ('CVehicleModelInfo__InitDataList'): {
        const initDatas = mounterNode.InitDatas;
        if (Array.isArray(initDatas))
          for (const initData of initDatas) {
            const item = initData.Item;
            const gameName = item.gameName;
            if (typeof gameName === 'string') {
              const hash = joaat(gameName);
              if (gxt2.has(hash)) found[hash] = gameName;
            }
          }
        break;
      }
    }
  }

  return found;
}

// function scanYftDirForHash(gxt2, path, keyIs, valueIs) {
//   if (!fs.statSync(path).isDirectory()) throw Error('path must be a directory');

//   var found = {};
//   for (const ent of fs.readdirSync(path, { withFileTypes: true })) {
//     if (ent.isDirectory()) found = { ...found, ...scanYftDirForHash(gxt2, join(path, ent.name)) };
//     else if (ent.isFile() && ent.name.endsWith('.yft')) {
//       const hashValue = ent.name.slice(0, -4);
//       const hash = joaat(hashValue);
//       let key;
//       switch (keyIs) {
//         case 'value':
//           key = hashValue;
//           break;
//         case 'hash':
//         default:
//           key = hash;
//       }
//       let value;
//       switch (valueIs) {
//         case 'hash':
//           value = gxt2.has(hash) && hash;
//           break;
//         case 'data':
//           value = gxt2.get(hash);
//           break;
//         case 'value':
//         default:
//           value = gxt2.has(hash) && hashValue;
//       }
//       if (value) found[key] = value;
//     }
//   }

//   return found;
// }

module.exports = {
  invalidHashError,
  isValidUint32,
  joaat,
  // scanYftDirForHash,
  getLabelsFromMeta,
  invalidKeyError,
  isValidUint8String,
  validateBufferLength,
}