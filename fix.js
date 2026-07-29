const fs = require('fs'); 
const path = require('path'); 
function walk(dir) { 
  if (!fs.existsSync(dir)) return; 
  fs.readdirSync(dir).forEach(f => { 
    let p = path.join(dir, f); 
    if (fs.statSync(p).isDirectory()) walk(p); 
