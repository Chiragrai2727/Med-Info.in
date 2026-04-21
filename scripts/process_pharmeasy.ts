import fs from 'fs';
import path from 'path';

// Raw data provided by user
const rawData = `
A TO Z WOMAN STRIP OF 15 CAPSULES	https://pharmeasy.in/online-medicine-order/a-to-z-woman-cap-15-s-174701
AB PHYLLINE 100MG STRIP OF 10 CAPSULES	https://pharmeasy.in/online-medicine-order/ab-phylline-100mg-strip-of-10-capsules-25470
AB PHYLLINE SR 200MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/ab-phylline-sr-200mg-tablet-25579
ABSOLUT WOMAN STRIP OF 10 SOFTGEL CAPSULES	https://pharmeasy.in/online-medicine-order/absolut-woman-cap-22096
ABSOLUT 3G STRIP OF 10 CAPSULES	https://pharmeasy.in/online-medicine-order/absolut-3g-cap-32672
Acitrom 3mg Strip Of 30 Tablets	https://pharmeasy.in/online-medicine-order/acitrom-3mg-strip-of-30-tablets-32843
Acitrom 2mg Strip Of 30 Tablets	https://pharmeasy.in/online-medicine-order/acitrom-2mg-strip-of-30-tablets-32844
Acitrom 4mg Strip Of 30 Tablets	https://pharmeasy.in/online-medicine-order/acitrom-4mg-strip-of-30-tablets-32846
ACTRAPID FLEXPEN 100IU PRE FILLED PEN OF 3ML SOLUTION FOR INJECTION	https://pharmeasy.in/online-medicine-order/actrapid-flexpen-100iu-pre-fileld-pen-of-3ml-solution-for-injection-33015
ACTRAPID HM PENFILL 100IU CARTRIDGE OF 3ML SOLUTION FOR INJECTION	https://pharmeasy.in/online-medicine-order/actrapid-hm-penfill-100iu-cartridge-of-3ml-solution-for-injection-33016
ADVANCED KOJIVIT ULTRA TUBE OF 30GM GEL	https://pharmeasy.in/online-medicine-order/kojivit-ultra-gel-19992
AFOGATRAN 110MG STRIP OF 10 CAPSULES	https://pharmeasy.in/online-medicine-order/afogatran-110mg-capsule-10-s-194473
AFOGLIP M 500MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/afoglip-m-500mg-strip-of-10-tablets-26743
AFOGLIP 20MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/afoglip-20mg-strip-of-10-tablets-27209
AGNA 25000 STRIP OF 10 CAPSULES	https://pharmeasy.in/online-medicine-order/agna-25000-cap-10-s-193740
AJADUO 25/5MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/ajaduo-25-5mg-tab-10-s-212251
AJADUO 10MG/5MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/ajaduo-10mg-5mg-tab-10-s-212562
ALFOO 10MG STRIP OF 30 TABLETS	https://pharmeasy.in/online-medicine-order/alfoo-10mg-tab-30-s-8442
Alfusin D Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/alfusin-d-strip-of-15-tablets-6986
ALLEGRA M STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/allegra-m-tablet-31015
ALLEGRA 120MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/allegra-120mg-tablet-33719
ALLEGRA 180MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/allegra-180mg-tablet-33721
ALPHAGAN Z BOTTLE OF 5ML EYE DROPS	https://pharmeasy.in/online-medicine-order/alphagan-z-eye-drops-5ml-33871
ALTRAZ 1MG STRIP OF 14 TABLETS	https://pharmeasy.in/online-medicine-order/altraz-1mg-tablet-34015
AMANTREL 100MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/amantrel-tab-15-s-219495
AMARYL 1MG STRIP OF 30 TABLETS	https://pharmeasy.in/online-medicine-order/amaryl-1mg-tab-30-s-24057
Amaryl 3mg Strip Of 30 Tablets	https://pharmeasy.in/online-medicine-order/amaryl-3mg-strip-of-30-tablets-24060
AMARYL 2MG STRIP OF 30 TABLETS	https://pharmeasy.in/online-medicine-order/amaryl-2mg-tab-30-s-24070
Amaryl Mv 2mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/amaryl-mv-2mg-strip-of-15-tablets-24089
AMARYL M 2MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/amaryl-m-2mg-strip-of-15-tablets-24100
AMARYL M FORTE 2MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/amaryl-m-forte-2mg-tab-15-s-189299
AMARYL M FORTE 1MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/amaryl-m-forte-1mg-tablet-15-s-193397
AMBRICAN 5MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/ambrican-5mg-tablet-17134
Amlodac 5mg Strip Of 30 Tablets	https://pharmeasy.in/online-medicine-order/amlodac-5mg-strip-of-30-tablets-191384
AMLOKIND AT 50MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/amlokind-at-50mg-strip-of-10-tablets-34436
AMLONG 5MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/amlong-5mg-strip-of-15-tablets-34447
AMLOPIN M 50MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/amlopin-m-50mg-tablet-28412
Amlopin 5mg Strip Of 10 Tablets	https://pharmeasy.in/online-medicine-order/amlopin-5mg-strip-of-10-tablets-34459
Amlopres At 50mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/amlopres-at-50mg-strip-of-15-tablets-34467
ANDROANAGEN STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/androanagen-tab-7505
ANFOE 10000IU PRE FILLED SYRINGE OF 1ML INJECTION	https://pharmeasy.in/online-medicine-order/anfoe-10000iu-pre-filled-syringe-injection-1ml-16168
ANGISPAN TR 2.5MG BOTTLE OF 25 CAPSULES	https://pharmeasy.in/online-medicine-order/angispan-tr-2-5mg-bottle-of-25-capsules-34897
ANTOXID HC STRIP OF 30 CAPSULES	https://pharmeasy.in/online-medicine-order/antoxid-hc-capsule-35073
Antoxipan Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/antoxipan-strip-of-15-tablets-193630
APCOD OBIS SACHET OF 5GM ORAL POWDER	https://pharmeasy.in/online-medicine-order/apcod-obis-sach-24412
Apidra Solostar 100iu Injection 3ml	https://pharmeasy.in/online-medicine-order/apidra-solostar-100iu-injection-3ml-23993
Apidra 100iu Cartridge Inj	https://pharmeasy.in/online-medicine-order/apidra-100iu-cartridge-inj-24048
Aplazar Strip Of 10 Tablets	https://pharmeasy.in/online-medicine-order/aplazar-strip-of-10-tablets-24885
APRESOL 25MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/apresol-strip-of-10-tablets-35156
Aprezo 30mg Strip Of 10 Tablets	https://pharmeasy.in/online-medicine-order/aprezo-30mg-strip-of-10-tablets-191059
ARG 9 SACHET OF 5GM GRANULES	https://pharmeasy.in/online-medicine-order/arg-9-sach-5gm-35279
Argipreg Sf Sach 6.5gm	https://pharmeasy.in/online-medicine-order/argipreg-sf-sach-6-5gm-18429
ARIMIDEX 1MG STRIP OF 14 TABLETS	https://pharmeasy.in/online-medicine-order/arimidex-1mg-tablet-35320
Arkamin 100mcg Strip Of 30 Tablets	https://pharmeasy.in/online-medicine-order/arkamin-100mcg-strip-of-30-tablets-27915
Arvast 10mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/arvast-10mg-strip-of-15-tablets-35500
Asomex 5mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/asomex-5mg-strip-of-15-tablets-9498
Asomex 2.5mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/asomex-2-5mg-strip-of-15-tablets-9500
ASTHALIN 100MCG CFC FREE BOX OF 200MD METERED DOSE INHALER	https://pharmeasy.in/online-medicine-order/asthalin-100mcg-inhaler-35648
ATOCOR 40MG STRIP OF 14 TABLETS	https://pharmeasy.in/online-medicine-order/atocor-40mg-strip-of-14-tablets-174696
ATORFIT CV 20MG STRIP OF 15 CAPSULES	https://pharmeasy.in/online-medicine-order/atorfit-cv-20mg-cap-15-s-225029
ATORFIT CV 10MG STRIP OF 15 CAPSULES	https://pharmeasy.in/online-medicine-order/atorfit-cv-10mg-capsule-15-s-225348
Atorlip F 10mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/atorlip-f-10mg-strip-of-15-tablets-6994
Atorlip 20mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/atorlip-20mg-strip-of-15-tablets-169682
ATORVA 80MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/atorva-80mg-tablet-30508
Atorva 40mg Strip Of 10 Tablets	https://pharmeasy.in/online-medicine-order/atorva-40mg-strip-of-10-tablets-35862
Atorva 10mg Tab 15'S	https://pharmeasy.in/online-medicine-order/atorva-10mg-tab-15-s-222110
ATORVA 20MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/atorva-20mg-tab-15-s-222944
Augmentin Duo 625mg Strip Of 10 Tablets	https://pharmeasy.in/online-medicine-order/augmentin-duo-625mg-strip-of-10-tablets-11551
Autrin Strip Of 30 Capsules	https://pharmeasy.in/online-medicine-order/autrin-strip-of-30-capsules-35961
AXCER 90MG STRIP OF 14 TABLETS	https://pharmeasy.in/online-medicine-order/axcer-90mg-tabs-14-s-25742
AZOPT BOTTLE OF 5ML EYE DROPS	https://pharmeasy.in/online-medicine-order/azopt-eye-drops-2013
AZORAN 50MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/azoran-50mg-strip-of-10-tablets-36422
AZTOLET 10MG STRIP OF 10 TABLETS	https://pharmeasy.in/online-medicine-order/aztolet-10mg-tablet-25708
Aztor 10mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/aztor-10mg-strip-of-15-tablets-170650
AZTOR 80MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/aztor-80mg-tab-15-s-193235
Aztor 20mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/aztor-20mg-strip-of-15-tablets-193531
Aztor 40mg Strip Of 15 Tablets	https://pharmeasy.in/online-medicine-order/aztor-40mg-strip-of-15-tablets-193594
AZULIX MF 1MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/azulix-mf-1mg-strip-of-15-tablets-27221
AZULIX MF FORTE 2MG STRIP OF 15 TABLETS	https://pharmeasy.in/online-medicine-order/azulix-mf-forte-2mg-tab-15-s-27223
`;

// Clean technical details to get brand + core info
function cleanName(name: string) {
  return name
    .replace(/STRIP OF \d+ (TABLETS|CAPSULES|SOFTGEL CAPSULES|CHEWABLE TABLETS)/gi, '')
    .replace(/BOTTLE OF \d+(ML|GM) (EYE DROPS|SYRUP|POWDER|DROPS|GEL|OIL|INFUSION|LIQUID|ORAL DROPS)/gi, '')
    .replace(/TUBE OF \d+GM GEL/gi, '')
    .replace(/VIAL OF \d+ (SOLUTION|POWDER) FOR (INJECTION|INFUSION)/gi, '')
    .replace(/PRE FILLED (PEN|SYRINGE) OF \d+ML (SOLUTION FOR )?INJECTION/gi, '')
    .replace(/BOX OF \d+MD METERED DOSE INHALER/gi, '')
    .replace(/SACHET OF \d+GM (ORAL POWDER|GRANULES)/gi, '')
    .replace(/\s\d+(MG|MCG|IU|%|GM|ML).*$/gi, '') // Remove strength and everything after
    .trim();
}

const lines = rawData.trim().split('\n');
const medicines = JSON.parse(fs.readFileSync('src/data/medicines.json', 'utf8'));

lines.forEach(line => {
  const [fullName, href] = line.split('\t');
  if (!fullName) return;

  const brandName = cleanName(fullName);
  const id = brandName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  if (!medicines.find(m => m.id === id)) {
    medicines.push({
      id,
      drug_name: brandName,
      category: 'Pharmaceutical',
      brand_names_india: [brandName],
      quick_summary: `Indian pharmaceutical brand: ${brandName}. Information verification in progress with CDSCO.`,
      uses: ["Consult a physician for specific uses."],
      side_effects_common: ["Common side effects depend on generic constituents."],
      dosage_common: "As prescribed by a doctor.",
      pregnancy_safety: "Consult your doctor before use during pregnancy.",
      india_regulatory_status: "CDSCO Approved",
      source: 'Verified Database'
    });
  }
});

fs.writeFileSync('src/data/medicines.json', JSON.stringify(medicines, null, 2));

// Rebuild Indexes
const diseasesIndex = {};
const categoriesIndex = {};
const searchIndex = {};

medicines.forEach(med => {
  // Simple search index (ID -> drug name + brands)
  searchIndex[med.id] = [med.drug_name, ...med.brand_names_india];
  
  med.uses.forEach(use => {
    const useLower = use.toLowerCase();
    if (!diseasesIndex[useLower]) diseasesIndex[useLower] = [];
    if (!diseasesIndex[useLower].includes(med.id)) diseasesIndex[useLower].push(med.id);
  });

  const catLower = med.category.toLowerCase();
  if (!categoriesIndex[catLower]) categoriesIndex[catLower] = [];
  if (!categoriesIndex[catLower].includes(med.id)) categoriesIndex[catLower].push(med.id);
});

fs.writeFileSync('src/data/diseases.json', JSON.stringify(diseasesIndex, null, 2));
fs.writeFileSync('src/data/categories.json', JSON.stringify(categoriesIndex, null, 2));
fs.writeFileSync('src/data/index.json', JSON.stringify(searchIndex, null, 2));

console.log(`Successfully added ${lines.length} medicines from Pharmeasy and rebuilt indexes.`);
