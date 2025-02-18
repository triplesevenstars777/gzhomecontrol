var fs = require('fs');

function readWriteSync() {
    let env = process.env.ENV;
    if (!process.env.ENV) {
        env = 'dev';  //SETTING DEFAULT ENV AS DEV
    }
    
    var data = fs.readFileSync(`src/environments/environment.${env}.ts`, 'utf-8');
    fs.writeFileSync('src/environments/environment.ts', data, 'utf-8');
    // console.log('Update environment:::>', `src/environments/environment.${env}.ts`, `src/environments/environment.ts`);
}

readWriteSync();