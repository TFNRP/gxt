const { FXT, GXT2, GXT } = require("../src");
const fs = require('node:fs');
const path = require('node:path');

const outDir = path.join(__dirname, '..', 'out');

const one = FXT(fs.readFileSync(path.join(__dirname, 'english.one.fxt')));
const two = GXT(fs.readFileSync(path.join(__dirname, 'e.two.gxt')));
const three = GXT(fs.readFileSync(path.join(__dirname, 'american.three.gxt')));
const vc = GXT(fs.readFileSync(path.join(__dirname, 'american.vc.gxt')));
const four = GXT(fs.readFileSync(path.join(__dirname, 'american.four.gxt')));
const five = GXT2(fs.readFileSync(path.join(__dirname, 'global.five.gxt2')));

fs.writeFileSync(path.join(outDir, 'one.json'), JSON.stringify(one.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'two.json'), JSON.stringify(two.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'three.json'), JSON.stringify(three.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'vc.json'), JSON.stringify(vc.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'four.json'), JSON.stringify(four.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'five.json'), JSON.stringify(five.toJSON(), null, 2));