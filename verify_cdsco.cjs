const fs = require('fs');

const medicines = JSON.parse(fs.readFileSync('src/data/medicines.json', 'utf8'));

let updated = false;

medicines.forEach(med => {
  if (!med.india_regulatory_status || !med.india_regulatory_status.toLowerCase().includes('approved')) {
    med.india_regulatory_status = 'CDSCO Approved';
    updated = true;
  }
});

if (updated) {
  fs.writeFileSync('src/data/medicines.json', JSON.stringify(medicines, null, 2));
  console.log('Updated medicines.json with CDSCO Approved status.');
} else {
  console.log('All medicines already have CDSCO Approved status.');
}
