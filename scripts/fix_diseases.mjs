import fs from 'fs';

const diseasesPath = './src/data/diseases.json';
const diseasesDb = JSON.parse(fs.readFileSync(diseasesPath, 'utf8'));

for (const key of Object.keys(diseasesDb)) {
    if (diseasesDb[key] && typeof diseasesDb[key] === 'object' && !Array.isArray(diseasesDb[key])) {
        diseasesDb[key] = diseasesDb[key].medications || [];
    }
}

fs.writeFileSync(diseasesPath, JSON.stringify(diseasesDb, null, 2));
console.log("Fixed diseases.json structure");
