import fs from 'fs';

const filePath = './src/data/medicines.json';

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const cleanedData = data.map((med: any) => {
        // Remove reference_url or any pharmeasy links
        const { reference_url: _ref, pharmeasy_url: _pharm, ...rest } = med;
        
        // Also check if any string field contains pharmeasy
        Object.keys(rest).forEach(key => {
            const val = rest[key];
            if (typeof val === 'string' && val.includes('pharmeasy')) {
                rest[key] = val.replace(/https?:\/\/pharmeasy\.in[^\s]*/g, '');
            }
        });
        
        return rest;
    });

    fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
    console.log('Successfully cleaned medicines.json of external links.');
} catch (error) {
    console.error('Error cleaning file:', error);
}
