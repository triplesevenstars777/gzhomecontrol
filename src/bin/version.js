const {replaceInFileSync} = require('replace-in-file');
const package = require("../../package.json");
const moment = require('moment');

const prodBuildVersion = package.version;
const devBuildVersion = package.version_dev;

if (!devBuildVersion) {
    console.error('Error: version_dev is not defined in package.json');
    process.exit(1);
}

if (!package.apps || !package.apps.default) {
    console.error('Error: apps.default is not defined in package.json');
    process.exit(1);
}

const arrayValues = devBuildVersion.split('.');
const rc = arrayValues.pop();

const configXmlDefaultId = {
    files: ['config.xml'],
    from: / id="x.x.x"/g,
    to: ` id="${package.apps.default.id}"`,
    allowEmptyPaths: false,
};

const configXmlDefaultName = {
    files: ['config.xml'],
    from: /(<name>)(.*)(<\/name>)/gi,
    to: `<name>${package.apps.default.name}</name>`,
    allowEmptyPaths: false,
};

const configXmlProdVersion = {
    files: ['config.xml'],
    from: /" version="([0-9]\.*[0-9]\.*[0-9A-Z]*)"/g,
    to: `" version="${prodBuildVersion}"`,
    allowEmptyPaths: false,
};

const configXmlDevVersion = {
    files: ['config.xml'],
    from: /" version="([0-9]\.*[0-9]\.*[0-9A-Z]*)"/g,
    to: `" version="${devBuildVersion}"`,
    allowEmptyPaths: false,
};

const prodBuildVersionCustom = `v${prodBuildVersion} - ${moment().format('DD.MM.YYYY')}`;
const environmentProdTs = {
    files: ['src/environments/environment.prod.ts'],
    from: /version: '(.*)'/g,
    to: `version: '${prodBuildVersionCustom}'`,
    allowEmptyPaths: false,
};

let environmentTsCss = {
    files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
    from: /css: '(.*)'/g,
    to: `css: '${package.apps.default.css}'`,
    allowEmptyPaths: false,
};

const devBuildVersionCustom = `v${arrayValues.join('.')}rc${rc} - ${moment().format('DD.MM.YYYY')}`;
const environmentDevTs = {
    files: ['src/environments/environment.dev.ts'],
    from: /version: '(.*)'/g,
    to: `version: '${devBuildVersionCustom}'`,
    allowEmptyPaths: false,
};

try {
    let env = process.env.ENV || 'dev';  // Default to 'dev' if ENV is not set
    let configXmlId;
    let configXmlVersion;
    let environmentTs;
    let environmentTsVersion;
    let environmentTsId;

    console.log('ENV', env);

    switch(env){
        case 'prod':
            configXmlId = configXmlDefaultId;
            configXmlVersion = configXmlProdVersion;
            configXmlName = configXmlDefaultName;
            environmentTs = environmentProdTs;
            environmentTsVersion = prodBuildVersionCustom;
            environmentTsId = {
                files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
                from: /id: '(.*)'/g,
                to: `id: '${package.apps.default.id}'`,
                allowEmptyPaths: false,
            };
            break;
        case 'emiZmart':
            configXmlId = {
                files: ['config.xml'],
                from: " id=\"x.x.x\"",
                to: " id=\""+ package.apps.emizmart.id + "\"",
                allowEmptyPaths: false,
            };
            configXmlVersion = configXmlProdVersion;
            configXmlName = {
                files: ['config.xml'],
                from: /(<name>)(.*)(<\/name>)/gi,
                to: "<name>"+ package.apps.emizmart.name + "</name>",
                allowEmptyPaths: false,
            };
            environmentTs = environmentProdTs;
            environmentTsVersion = prodBuildVersionCustom;
            environmentTsCss = {
                files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
                from: /css: '(.*)'/g,
                to: "css: '"+ package.apps.emizmart.css + "'",
                allowEmptyPaths: false,
            };
            environmentTsId = {
                files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
                from: /id: '(.*)'/g,
                to: "id: '"+ package.apps.emizmart.id + "'",
                allowEmptyPaths: false,
            };
            break;
        case 'zolliker':
          configXmlId = {
              files: ['config.xml'],
              from: " id=\"x.x.x\"",
              to: " id=\""+ package.apps.zolliker.id + "\"",
              allowEmptyPaths: false,
          };
          configXmlVersion = {
            files: ['config.xml'],
            from: /" version="([0-9]\.*[0-9]\.*[0-9A-Z]*)"/g,
            to: "\" version=\""+ prodBuildVersion + "\"",
            allowEmptyPaths: false,
          };
          configXmlName = {
              files: ['config.xml'],
              from: /(<name>)(.*)(<\/name>)/gi,
              to: "<name>"+ package.apps.zolliker.name + "</name>",
              allowEmptyPaths: false,
          };
          var zollikerBuildVersionCustom = "v" + prodBuildVersion + "Z - " + moment().format('DD.MM.YYYY');
          environmentTs = {
              files: ['src/environments/environment.prod.ts'],
              from: /version: '(.*)'/g,
              to: "version: '"+ zollikerBuildVersionCustom + "'",
              allowEmptyPaths: false,
          }
          environmentTsVersion = zollikerBuildVersionCustom;
          environmentTsCss = {
              files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
              from: /css: '(.*)'/g,
              to: "css: '"+ package.apps.zolliker.css + "'",
              allowEmptyPaths: false,
          };
          environmentTsId = {
              files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
              from: /id: '(.*)'/g,
              to: "id: '"+ package.apps.zolliker.id + "'",
              allowEmptyPaths: false,
          };
          break;
        case 'office':
          configXmlId = {
              files: ['config.xml'],
              from: " id=\"x.x.x\"",
              to: " id=\""+ package.apps.office.id + "\"",
              allowEmptyPaths: false,
          };
          configXmlVersion = {
            files: ['config.xml'],
            from: /" version="([0-9]\.*[0-9]\.*[0-9A-Z]*)"/g,
            to: "\" version=\""+ prodBuildVersion + "\"",
            allowEmptyPaths: false,
          };
          configXmlName = {
              files: ['config.xml'],
              from: /(<name>)(.*)(<\/name>)/gi,
              to: "<name>"+ package.apps.office.name + "</name>",
              allowEmptyPaths: false,
          };
          var officeBuildVersionCustom = "v" + prodBuildVersion + "O - " + moment().format('DD.MM.YYYY');
          environmentTs = {
              files: ['src/environments/environment.prod.ts'],
              from: /version: '(.*)'/g,
              to: "version: '"+ officeBuildVersionCustom + "'",
              allowEmptyPaths: false,
          }
          environmentTsVersion = officeBuildVersionCustom;
          environmentTsCss = {
              files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
              from: /css: '(.*)'/g,
              to: "css: '"+ package.apps.office.css + "'",
              allowEmptyPaths: false,
          };
          environmentTsId = {
              files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
              from: /id: '(.*)'/g,
              to: "id: '"+ package.apps.office.id + "'",
              allowEmptyPaths: false,
          };
          break;
        case 'test':
            configXmlId = {
                files: ['config.xml'],
                from: /( id=\")([a-z]*\.[a-z]*\.[a-z]*)(\")/g,
                to: " id=\""+ package.apps.test.id + "\"",
                allowEmptyPaths: false,
            };
            configXmlName = {
                files: ['config.xml'],
                from: /(<name>)(.*)(<\/name>)/gi,
                to: "<name>"+ package.apps.test.name + "</name>",
                allowEmptyPaths: false,
            };
            configXmlVersion = configXmlProdVersion;
            environmentTs = {
                files: ['src/environments/environment.test.ts'],
                from: /version: '(.*)'/g,
                to: "version: '"+ prodBuildVersionCustom + "'",
                allowEmptyPaths: false,
            };
            environmentTsVersion = prodBuildVersionCustom;
            environmentTsId = {
                files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
                from: /id: '(.*)'/g,
                to: "id: '"+ package.apps.test.id + "'",
                allowEmptyPaths: false,
            };
            break;
        case 'dev':
            configXmlId = configXmlDefaultId;
            configXmlName = configXmlDefaultName;
            configXmlVersion = configXmlDevVersion;
            environmentTs = environmentDevTs;
            environmentTsVersion = devBuildVersionCustom;
            environmentTsId = {
                files: ['src/environments/environment.prod.ts', 'src/environments/environment.dev.ts', 'src/environments/environment.ts'],
                from: /id: '(.*)'/g,
                to: `id: '${package.apps.default.id}'`,
                allowEmptyPaths: false,
            };
            break;
    }

    // Reset id on config.xml
    let changedFiles = replaceInFileSync({
        files: ['config.xml'],
        from: /( id=\")([a-z]*\.[a-z]*\.[a-z\-]*)(\")/g,
        to: " id=\"x.x.x\""
    });
    if (changedFiles.length > 0) {
        console.log("Reset id on config.xml");
    }

    // Reset version on config.xml
    changedFiles = replaceInFileSync({
        files: ['config.xml'],
        from: /\" version=\"([0-9]*.[0-9]*.[0-9]*)\"/g,
        to: "\" version=\"0.0.0\""
    });
    if (changedFiles.length > 0) {
        console.log("Reset version on config.xml");
    }

    // Replace ID on XML
    changedFiles = replaceInFileSync(configXmlId);
    if (changedFiles.length > 0) {
        console.log("Updated " + configXmlId.files);
    }

    // Replace version on XML
    changedFiles = replaceInFileSync(configXmlVersion);
    if (changedFiles.length > 0) {
        console.log("Updated " + configXmlVersion.files);
    }

    // Replace name on XML
    changedFiles = replaceInFileSync(configXmlName);
    if (changedFiles.length > 0) {
        console.log("Updated " + configXmlName.files);
    }

    // Replace version ENV
    changedFiles = replaceInFileSync(environmentTs);
    if (changedFiles.length > 0) {
        console.log("Updated " + environmentTs.files);
    }

    // Replace version CURRENT ENV
    changedFiles = replaceInFileSync({
        files: ['src/environments/environment.ts'],
        from: /version: '(.*)'/g,
        to: `version: '${environmentTsVersion}'`,
        allowEmptyPaths: false,
    });
    if (changedFiles.length > 0) {
        console.log("Updated src/environments/environment.ts");
    }

    // Replace css ENV
    changedFiles = replaceInFileSync(environmentTsCss);
    if (changedFiles.length > 0) {
        console.log("Updated " + environmentTsCss.files);
    }

    // Replace id ENV
    changedFiles = replaceInFileSync(environmentTsId);
    if (changedFiles.length > 0) {
        console.log("Updated " + environmentTsId.files);
    }

    console.log('Build version: "' + environmentTsVersion + '"');
} catch (error) {
    console.error('Error:', error);
    throw error;
}
