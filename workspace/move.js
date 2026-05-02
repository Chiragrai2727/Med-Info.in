const fs = require('fs');
const path = require('path');

function moveDir(src, dest) {
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    fs.renameSync(srcPath, destPath);
  }
}

moveDir('/workspace/temp-app', '/workspace');
console.log('Moved files successfully');
