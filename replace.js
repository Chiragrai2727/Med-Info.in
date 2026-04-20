const fs = require('fs');

const path = 'src/services/geminiService.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace ANY remaining instances of `ai.models.generateContent`
code = code.replace(/ai\.models\.generateContent/g, 'getAIClient().models.generateContent');
// Also remove the `const ai = new GoogleGenAI({ apiKey });` if it still exists
code = code.replace(/const ai = new GoogleGenAI\(\{ apiKey \}\);/, '');

fs.writeFileSync(path, code);
console.log('Done replacing!');
