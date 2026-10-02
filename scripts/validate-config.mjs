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
  'request-pdf-layout.js',
  'request-pdf-parser.js',
  'scripts/test-request-parser.mjs',
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
  './request-pdf-layout.js',
  './request-pdf-parser.js',
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

if (!/test@jncostech\.com/.test(login) || !/Test login/.test(login) || !/1111/.test(login)) {
  throw new Error('Dedicated test login must remain available.');
}

if (!/name="robots" content="noindex,nofollow,noarchive"/.test(login) || !/name="robots" content="noindex,nofollow,noarchive"/.test(index)) {
  throw new Error('Production CRM pages must include noindex metadata.');
}

if (!/dataProvider:\s*'firebase'/.test(appConfig)) {
  throw new Error('Production CRM must use the Firebase data provider.');
}

const provider = fs.readFileSync('data-provider.js','utf8');
if (!/jnc-demo-mode/.test(provider) || !/window\.CRMStore/.test(provider)) {
  throw new Error('Dedicated test login must route to the isolated demo provider.');
}

console.log('Production launch checks passed.');


if (!/pdf\.js\/3\.11\.174\/pdf\.min\.js/.test(index)) {
  throw new Error('index.html must load the PDF.js runtime.');
}
if (!/id="requestPdfInput"/.test(index)) {
  throw new Error('Request PDF file input is missing.');
}
if (!/import-request-pdf/.test(appJs) || !/importRequestPdf/.test(appJs)) {
  throw new Error('Request PDF import action is missing from app.js.');
}
if (!/sourceDocumentId/.test(appJs) || !/Website Request PDF/.test(appJs)) {
  throw new Error('Request PDF → Lead mapping is incomplete.');
}
console.log('Request PDF import checks passed.');


const layoutJs = fs.readFileSync('request-pdf-layout.js','utf8');
if (!/function groupTextItems/.test(layoutJs) || !/columnGap/.test(layoutJs)) {
  throw new Error('Deterministic request PDF layout grouper is missing.');
}
if (!/request-pdf-layout\.js\?v=20261002-pdf7/.test(index)) {
  throw new Error('index.html must load request-pdf-layout.js v7.');
}
console.log('Request PDF deterministic layout checks passed.');
