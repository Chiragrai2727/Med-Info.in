import fs from 'fs';

const medicinesPath = './src/data/medicines.json';
const indexPath = './src/data/index.json';
const categoriesPath = './src/data/categories.json';
const diseasesPath = './src/data/diseases.json';

const medicines = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
let index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
let categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
let diseases = JSON.parse(fs.readFileSync(diseasesPath, 'utf8'));

// Only process the first 7 medicines we just added
const newMedicines = medicines.slice(0, 7);

newMedicines.forEach((med: any) => {
  // Update index.json
  const terms = [med.drug_name, ...med.brand_names_india].map((t: string) => t.toLowerCase());
  terms.forEach((term: string) => {
    if (!index[term]) index[term] = [];
    if (!index[term].includes(med.id)) index[term].push(med.id);
  });

  // Update categories.json
  const cat = med.category.toLowerCase();
  if (!categories[cat]) categories[cat] = [];
  if (!categories[cat].includes(med.id)) categories[cat].push(med.id);

  // Update diseases.json
  med.uses.forEach((use: string) => {
    const u = use.toLowerCase();
    if (!diseases[u]) diseases[u] = [];
    if (!diseases[u].includes(med.id)) diseases[u].push(med.id);
  });
});

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
fs.writeFileSync(diseasesPath, JSON.stringify(diseases, null, 2));

console.log("Successfully updated datasets.");
