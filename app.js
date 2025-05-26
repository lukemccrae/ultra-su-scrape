const fs = require('fs');
const data = fs.readFileSync('racelist.json', 'utf8');
const arr = JSON.parse(data);
console.log(arr.length);