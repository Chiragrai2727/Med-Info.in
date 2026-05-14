import fs from "fs";
try {
  JSON.parse(fs.readFileSync("./src/data/medicines.json", "utf-8"));
  console.log("Medicines OK");
} catch(e) { console.error("Medicines:", e.message); }
try {
  JSON.parse(fs.readFileSync("./src/data/banned_medicines.json", "utf-8"));
  console.log("Banned OK");
} catch(e) { console.error("Banned:", e.message); }
