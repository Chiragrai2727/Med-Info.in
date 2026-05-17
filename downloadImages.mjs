import fs from 'fs';
import https from 'https';

const files = [
  'logo.png',
  'logo-white.png',
  'chirag.jpg',
  'sagar.jpg',
  'favicon.svg'
];

async function downloadFile(filename) {
  const url = `https://raw.githubusercontent.com/Chiragrai2727/Med-Info.in/main/public/${filename}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.log(`Failed to download ${filename}: ${res.statusCode}`);
        resolve(); // Continue anyway
        return;
      }
      const stream = fs.createWriteStream(`./public/${filename}`);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      console.error(`Error downloading ${filename}: ${err.message}`);
      resolve();
    });
  });
}

(async () => {
  for (const file of files) {
    await downloadFile(file);
  }
  console.log('All downloads finished.');
})();
