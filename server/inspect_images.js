import fs from 'fs';
import path from 'path';

// Let's inspect the files in assets and user_uploaded
const assetsDir = 'c:/Users/acer/Downloads/gjshospitals.com (1)/client/src/assets';
const uploadedDir = 'C:/Users/acer/.gemini/antigravity/brain/3a6c64f7-4501-4e43-be81-9ec8a49c42f4/.user_uploaded';

console.log('--- ASSETS ---');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  files.forEach(f => {
    const stats = fs.statSync(path.join(assetsDir, f));
    if (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.gif')) {
      console.log(`${f}: ${stats.size} bytes`);
    }
  });
}

console.log('\n--- UPLOADED ---');
if (fs.existsSync(uploadedDir)) {
  const files = fs.readdirSync(uploadedDir);
  files.forEach(f => {
    const stats = fs.statSync(path.join(uploadedDir, f));
    if (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp')) {
      console.log(`${f}: ${stats.size} bytes`);
    }
  });
}
