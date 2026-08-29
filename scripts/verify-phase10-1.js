const fs = require('fs');

const workflow = fs.readFileSync('.github/workflows/build-ipa.yml', 'utf8');
const required = [
  'runs-on: macos-14',
  'node-version: 20',
  'npm ci',
  'expo prebuild --platform ios --clean --non-interactive',
  'CODE_SIGNING_ALLOWED=NO',
  'CODE_SIGNING_REQUIRED=NO',
  'BioStack_PRO_iOS_unsigned.ipa',
  'actions/upload-artifact@v4',
];
const forbidden = [
  'aps-environment',
  'npm install -g expo-cli',
];

const missing = required.filter(s => !workflow.includes(s));
const presentForbidden = forbidden.filter(s => workflow.includes(s));

if (missing.length || presentForbidden.length) {
  console.error('Phase 10.1 verification failed.');
  if (missing.length) console.error('Missing:', missing);
  if (presentForbidden.length) console.error('Forbidden:', presentForbidden);
  process.exit(1);
}

console.log('Phase 10.1 verification: PASS');
