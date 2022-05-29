const { FXT, GXT2, GXT } = require("../src");
const fs = require('node:fs');
const path = require('node:path');

const outDir = path.join(__dirname, '..', 'out');

const one = FXT(fs.readFileSync(path.join(__dirname, 'assets', 'one.fxt')));
const two = GXT(fs.readFileSync(path.join(__dirname, 'assets', 'two.gxt')));
const three = GXT(fs.readFileSync(path.join(__dirname, 'assets', 'three.gxt')));
const vc = GXT(fs.readFileSync(path.join(__dirname, 'assets', 'vc.gxt')));
const four = GXT(fs.readFileSync(path.join(__dirname, 'assets', 'four.gxt')));
const five = GXT2(fs.readFileSync(path.join(__dirname, 'assets', 'five.gxt2')));

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.writeFileSync(path.join(outDir, 'one.json'), JSON.stringify(one.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'two.json'), JSON.stringify(two.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'three.json'), JSON.stringify(three.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'vc.json'), JSON.stringify(vc.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'four.json'), JSON.stringify(four.toJSON(), null, 2));
fs.writeFileSync(path.join(outDir, 'five.json'), JSON.stringify(five.toJSON(), null, 2));