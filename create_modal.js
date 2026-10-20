const fs = require('fs'); 
const https = require('https'); 
fs.writeFileSync('src/components/VacationModal.tsx', fs.readFileSync('src/components/VacationModal.tsx', 'utf8'), 'utf8'); 
