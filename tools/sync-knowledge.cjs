'use strict';
const fs = require('node:fs');
const path = require('node:path');
const K = require('../knowledge-core.js');
const base = path.resolve(__dirname, '..');
const pack = K.validate(JSON.parse(fs.readFileSync(path.join(base, 'knowledge/tva.json'), 'utf8')));
fs.writeFileSync(path.join(base, 'knowledge/tva.bundle.js'), K.bundle(pack));
console.log('Wissenspaket geprüft; Offlinepaket synchronisiert:', pack.entries.length, 'Einträge.');
