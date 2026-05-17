import fs from 'fs';
console.log(fs.statSync('public/logo.png').size);
console.log(fs.statSync('public/logo-white.png').size);
