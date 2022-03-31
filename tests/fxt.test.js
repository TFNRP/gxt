const FXT = require('../src/FXT');
const fs = require('node:fs');
const path = require('node:path');

const data = fs.readFileSync(path.join(__dirname, 'english.fxt'));
const fxt = FXT(data);

describe('FXT', () => {
  test('is expected size', () => {
    expect(fxt.size).toBe(1_792);
  });

  test('data === export', () => {
    expect(fxt.export().compare(data)).toBe(0);
  });

  test('has expected first entry', () => {
    expect(fxt.get('1001')).toBe('Answer the South Park phones to get jobs. Keep your eyes open for opportunities. Remember - you mess up, we mess you up.');
  });

  test('description can be set', () => {
    const description = 'Better vocabulary';
    fxt.set('1001', description);
    expect(fxt.get('1001')).toBe(description);
  })
});