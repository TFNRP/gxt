const GXT2 = require('../src/GXT2');
const fs = require('node:fs');
const path = require('node:path');

const data = fs.readFileSync(path.join(__dirname, 'global.gxt2'));
const gxt2 = GXT2(data);

describe('GXT2', () => {
  test('is expected size', () => {
    expect(gxt2.size).toBe(259);
    expect([...gxt2.keys()].length).toBe(259);
  });

  test('has expected first entry (hash)', () => {
    expect(gxt2.has(73625899)).toBe(true);
    expect(gxt2.get(73625899)).toBe('Painted Bumper w/ Protectors MkI');
    expect(gxt2.keys().next().value).toBe(73625899);
  });

  test('has expected first entry (string->hash)', () => {
    expect(gxt2.has('LCPD_BUMF_B3')).toBe(true);
    expect(gxt2.get('LCPD_BUMF_B3')).toBe('Painted Bumper w/ Protectors MkI');
  });

  test('entry can be changed as expected', () => {
    const entry = 'Painted Bumper w/o Protectors';
    const previousLength = gxt2.buffer.length;
    const entryDiff = gxt2.get(73625899).length - entry.length;

    expect(gxt2.set(73625899, entry)).toBeInstanceOf(GXT2);
    expect(gxt2.get(73625899)).toBe(entry);
    expect(gxt2.buffer.length).toBe(previousLength - previousLength);
  });
});