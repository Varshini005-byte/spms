const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src/components');
const target = 'http://localhost:5000';
const replacement = 'https://spms-ie7g.onrender.com';

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    files.forEach(function (file) {
        if(file.endsWith('.js')) {
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(target)) {
                content = content.replace(new RegExp(target, 'g'), replacement);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    });
});
