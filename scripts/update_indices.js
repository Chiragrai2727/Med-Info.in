import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const medicinesPath = path.join(__dirname, '../src/data/medicines.json');
const indexPath = path.join(__dirname, '../src/data/index.json');
const categoriesPath = path.join(__dirname, '../src/data/categories.json');
const diseasesPath = path.join(__dirname, '../src/data/diseases.json');

const medicines = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));

const index = {};
const categories = {};
const diseases = {};

medicines.forEach(med => {
  const id = med.id;
  
  // Index by drug name and brands
  const terms = [
    med.drug_name.toLowerCase(),
    ...med.brand_names_india.map(b => b.toLowerCase()),
    med.drug_class.toLowerCase(),
    med.category.toLowerCase()
  ];
  
  terms.forEach(term => {
    if (!index[term]) index[term] = [];
    if (!index[term].includes(id)) index[term].push(id);
    
    // Also index individual words for better search
    const words = term.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        if (!index[word]) index[word] = [];
        if (!index[word].includes(id)) index[word].push(id);
      }
    });
  });

  // Categories index
  const cat = med.category.toLowerCase();
  if (!categories[cat]) categories[cat] = [];
  if (!categories[cat].includes(id)) categories[cat].push(id);

  // Diseases index
  med.uses.forEach(use => {
    const disease = use.toLowerCase();
    if (!diseases[disease]) diseases[disease] = [];
    if (!diseases[disease].includes(id)) diseases[disease].push(id);
    
    // Also index individual words for diseases
    const words = disease.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        if (!diseases[word]) diseases[word] = [];
        if (!diseases[word].includes(id)) diseases[word].push(id);
      }
    });
  });
});

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
fs.writeFileSync(diseasesPath, JSON.stringify(diseases, null, 2));

console.log('Indices updated successfully!');
