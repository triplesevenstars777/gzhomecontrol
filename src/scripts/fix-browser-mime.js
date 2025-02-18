#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platformRoot = path.join(context.opts.projectRoot, 'platforms/browser');
    const configXml = path.join(platformRoot, 'config.xml');

    if (fs.existsSync(configXml)) {
        let content = fs.readFileSync(configXml, 'utf8');
        
        // Add MIME types
        if (!content.includes('<mime-type>')) {
            const mimeTypes = `
                <mime-mapping>
                    <extension>css</extension>
                    <mime-type>text/css</mime-type>
                </mime-mapping>
                <mime-mapping>
                    <extension>js</extension>
                    <mime-type>application/javascript</mime-type>
                </mime-mapping>
            `;
            content = content.replace('</widget>', mimeTypes + '</widget>');
            fs.writeFileSync(configXml, content);
        }
    }
}; 