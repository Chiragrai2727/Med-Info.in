const fs = require('fs');

const medicines = JSON.parse(fs.readFileSync('src/data/medicines.json', 'utf8'));

medicines.forEach(med => {
  const uses = med.uses.map(u => u.toLowerCase());
  
  if (uses.includes('high blood pressure') && !uses.includes('hypertension')) {
    med.uses.push('Hypertension');
  }
  if ((uses.includes('cold') || uses.includes('cough')) && !uses.includes('cold & cough')) {
    med.uses.push('Cold & Cough');
  }
  if (uses.includes('acid reflux') || uses.includes('gerd') || uses.includes('heartburn')) {
    if (!uses.includes('acidity')) med.uses.push('Acidity');
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

console.log('Successfully normalized uses and rebuilt indexes.');
