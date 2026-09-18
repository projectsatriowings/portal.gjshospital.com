import fs from 'fs';

const filePath = 'c:/Users/acer/Downloads/gjshospitals.com (1)/client/public/gjs frontend elivation.png';

const buffer = fs.readFileSync(filePath);
const width = buffer.readInt32BE(16);
const height = buffer.readInt32BE(20);

console.log(`PNG Dimensions: ${width}x${height}`);
