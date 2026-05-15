import * as fs from 'fs';
const data = JSON.parse(fs.readFileSync('src/data/medicines.json', 'utf8'));
console.log("Count:", data.length);
