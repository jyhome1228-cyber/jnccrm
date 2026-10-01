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


const appJs = fs.readFileSync('app.js', 'utf8');
const login = fs.readFileSync('login.html', 'utf8');
const appConfig = fs.readFileSync('app-config.js', 'utf8');

const calendarBindingCount = (appJs.match(/let calendarEventCache = \[\];/g) || []).length;
if (calendarBindingCount !== 1) {
  throw new Error(`Expected exactly one calendarEventCache binding, found ${calendarBindingCount}`);
}

const linkedCalendarFnCount = (appJs.match(/function showCalendarLinkedEvent\(id\)/g) || []).length;
if (linkedCalendarFnCount !== 1) {
  throw new Error(`Expected exactly one showCalendarLinkedEvent function, found ${linkedCalendarFnCount}`);
}

if (/test@jncostech\.com|Test login|\/ 1111/.test(login)) {
  throw new Error('Production login must not expose test credentials.');
}

if (!/name="robots" content="noindex,nofollow,noarchive"/.test(login) || !/name="robots" content="noindex,nofollow,noarchive"/.test(index)) {
  throw new Error('Production CRM pages must include noindex metadata.');
}

if (!/dataProvider:\s*'firebase'/.test(appConfig)) {
  throw new Error('Production CRM must use the Firebase data provider.');
}

if (/jnc-demo-mode/.test(fs.readFileSync('data-provider.js','utf8'))) {
  throw new Error('Production data provider must not support demo-mode fallback.');
}

console.log('Production launch checks passed.');
