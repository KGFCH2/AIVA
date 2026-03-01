const fs = require('fs');
const r = JSON.parse(fs.readFileSync('./data/responses.json', 'utf8'));
fs.writeFileSync('keys.txt', Object.keys(r.greetings).join('\n'));
