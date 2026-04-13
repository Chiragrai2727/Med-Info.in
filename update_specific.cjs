const fs = require('fs');

const medicines = JSON.parse(fs.readFileSync('src/data/medicines.json', 'utf8'));

medicines.forEach(med => {
  const uses = med.uses.map(u => u.toLowerCase());
  
  if (med.id === 'cetirizine') {
    if (!uses.includes('cold & cough')) med.uses.push('Cold & Cough');
    if (!uses.includes('allergies')) med.uses.push('Allergies');
  }
  if (med.id === 'amoxicillin_clavulanate' || med.id === 'azithromycin') {
    if (!uses.includes('cold & cough')) med.uses.push('Cold & Cough');
  }
  if (med.id === 'paracetamol' || med.id === 'ibuprofen') {
    if (!uses.includes('cold & cough')) med.uses.push('Cold & Cough');
    if (!uses.includes('headache')) med.uses.push('Headache');
    if (!uses.includes('fever')) med.uses.push('Fever');
  }
  if (med.id === 'diclofenac') {
    if (!uses.includes('headache')) med.uses.push('Headache');
    if (!uses.includes('fever')) med.uses.push('Fever');
  }
});

fs.writeFileSync('src/data/medicines.json', JSON.stringify(medicines, null, 2));

const diseasesIndex = {};
const categoriesIndex = {};

medicines.forEach(med => {
  med.uses.forEach(use => {
    const useLower = use.toLowerCase();
    if (!diseasesIndex[useLower]) {
      diseasesIndex[useLower] = [];
    }
    if (!diseasesIndex[useLower].includes(med.id)) {
      diseasesIndex[useLower].push(med.id);
    }
    
    const words = useLower.split(/[\s,()]+/);
    words.forEach(word => {
      if (word.length > 3) {
        if (!diseasesIndex[word]) diseasesIndex[word] = [];
        if (!diseasesIndex[word].includes(med.id)) diseasesIndex[word].push(med.id);
      }
    });
  });

  const catLower = med.category.toLowerCase();
  if (!categoriesIndex[catLower]) {
    categoriesIndex[catLower] = [];
  }
  if (!categoriesIndex[catLower].includes(med.id)) {
    categoriesIndex[catLower].push(med.id);
  }
});

fs.writeFileSync('src/data/diseases.json', JSON.stringify(diseasesIndex, null, 2));
fs.writeFileSync('src/data/categories.json', JSON.stringify(categoriesIndex, null, 2));

console.log('Successfully updated specific medicines and rebuilt indexes.');
