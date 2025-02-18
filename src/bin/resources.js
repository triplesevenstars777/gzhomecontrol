#!/usr/bin/env node

var fs = require('fs');
var path = require('path');


var folders = [
    path.join(__dirname, '../../', 'resources/android/doorbell/'),
    path.join(__dirname, '../../', 'resources/android/panic/'),
    path.join(__dirname, '../../', 'resources/android/smoke/'),
    path.join(__dirname, '../../', 'resources/android/warning/')
]
var outputFolder = path.join(__dirname, '../../', '/platforms/android/app/src/main/res/');


console.log('------------------------------------------------------------------------------------------');
console.log('Copy resources for android');
console.log('------------------------------------------------------------------------------------------');

for(let folder of folders)
{
    fs.readdir(folder, function(err, list) {
        list.forEach(function(file){
            if (file.indexOf('drawable') === 0) {
                let filenameSplit = file.split('-');
                let destFolder = filenameSplit[0]+'-'+filenameSplit[1];
    
                if (!fs.existsSync(outputFolder + destFolder)){
                    fs.mkdirSync(outputFolder + destFolder);
                }
                fs.createReadStream(folder+file)
                  .pipe(fs.createWriteStream(outputFolder + destFolder + '/'+filenameSplit[2]));
                console.log('# ' + file + ' --> ' + destFolder+ '/'+filenameSplit[2]);
            }
        });
        console.log('-----------------------------------------------------------------------------------------');
    });
}
