import * as fs from 'fs';
import * as path from 'path';

const medicinesPath = path.join(process.cwd(), 'src/data/medicines.json');
const indexPath = path.join(process.cwd(), 'src/data/index.json');
const categoriesPath = path.join(process.cwd(), 'src/data/categories.json');
const diseasesPath = path.join(process.cwd(), 'src/data/diseases.json');

const medicines = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));

let index = {};
let categories = {};
let diseases = {};

medicines.forEach(med => {
  const brandNames = med.brand_names_india || [];
  const drugName = med.drug_name || "";
  const id = med.id;

  // Search Index
  [drugName, ...brandNames].forEach(name => {
    if (!name) return;
    const lowerName = name.toLowerCase();
    if (!index[lowerName]) index[lowerName] = [];
    if (!index[lowerName].includes(id)) index[lowerName].push(id);
  });

  // Categories Index
  const category = med.category;
  if (category) {
    if (!categories[category]) categories[category] = [];
    if (!categories[category].includes(id)) categories[category].push(id);
  }

  // Diseases Index (from uses)
  const uses = med.uses || [];
  uses.forEach(use => {
    if (!diseases[use]) diseases[use] = [];
    if (!diseases[use].includes(id)) diseases[use].push(id);
  });
});

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
fs.writeFileSync(diseasesPath, JSON.stringify(diseases, null, 2));

console.log("Indices updated successfully.");
