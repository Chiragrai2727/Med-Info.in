import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (!['node_modules', '.git', 'dist', '.next'].includes(f)) {
                walkDir(dirPath, callback);
            }
        } else {
            callback(path.join(dir, f));
        }
    });
}

const targetPattern = /https?:\/\/pharmeasy\.in[^\s",]*/g;

walkDir('.', (filePath) => {
    if (filePath.endsWith('.csv') || filePath.endsWith('.json')) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('pharmeasy.in')) {
                const cleaned = content.replace(targetPattern, '');
                fs.writeFileSync(filePath, cleaned);
                console.log(`Cleaned: ${filePath}`);
            }
        } catch (err) {
            console.error(`Failed to clean ${filePath}:`, err);
        }
    }
});
