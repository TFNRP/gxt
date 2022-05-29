const FXT = require('../src/FXT');
const fs = require('node:fs');
const path = require('node:path');

const data = fs.readFileSync(path.join(__dirname, 'assets', 'one.fxt'));
const fxt = FXT(data);

describe('FXT', () => {
  test('is expected size', () => {
    // FXT format usually contains an empty property/value pair at the end, as the last value is always discarded.
    expect(fxt.size).toBe(1_793);
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