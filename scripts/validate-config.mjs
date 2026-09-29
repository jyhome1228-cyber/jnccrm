import fs from 'node:fs';

const requiredJson = ['firebase.json', 'firestore.indexes.json'];
for (const file of requiredJson) {
  JSON.parse(fs.readFileSync(file, 'utf8'));
}

const requiredFiles = [
  'index.html',
  'login.html',
  'styles.css',
  'app.js',
  'crm-store.js',
  'app-config.js',
  'data-provider.js',
  'firebase-adapter.js',
  'firestore.rules',
  'storage.rules',
  'DATA_MODEL.md',
  'FIREBASE_SETUP.md'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const index = fs.readFileSync('index.html', 'utf8');
const scriptOrder = [
  './app-config.js',
  './crm-store.js',
  './firebase-adapter.js',
  './data-provider.js',
  './app.js'
];

let previous = -1;
for (const script of scriptOrder) {
  const position = index.indexOf(script);
  if (position < 0) throw new Error(`index.html does not include ${script}`);
  if (position <= previous) throw new Error(`Incorrect script order around ${script}`);
  previous = position;
}

console.log('JN COS TECH CRM validation passed.');
