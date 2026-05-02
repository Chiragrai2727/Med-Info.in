import fs from 'fs';
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const pkg = {
  name: "aethelcare",
  version: "0.0.0",
  type: "module",
  scripts: {
    "dev": "tsx server.ts",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "start": "node dist/server.mjs"
  },
  dependencies: lock.packages[""].dependencies,
  devDependencies: lock.packages[""].devDependencies
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Recovered package.json');
