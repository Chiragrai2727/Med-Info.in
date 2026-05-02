import fs from 'fs';
import path from 'path';
const src = path.join(process.cwd(), 'temp-app');
const dest = process.cwd();
const files = fs.readdirSync(src);
for (const file of files) {
  fs.renameSync(path.join(src, file), path.join(dest, file));
}
console.log('Moved files successfully');
