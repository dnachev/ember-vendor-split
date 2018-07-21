/* eslint-env node */
'use strict';

const fs = require('fs');
const vendorStaticFilepath = 'assets/vendor-static.js';
const vendorFilepath = '/assets/vendor.js';

module.exports = {
  name: 'ember-vendor-split',
  included(app) {
    const hasBower = fs.existsSync(app.root + '/bower.json');
    const emberSource = app.project.findAddonByName('ember-source');

    let filesConfig = ((app.options['ember-vendor-split'] || {}).files) || [];

    const useSource = !hasBower && emberSource;

    if (useSource) {
      filesConfig = [
        ...filesConfig,
        emberSource.paths.jquery,
        {
          production: emberSource.paths.prod,
          development: emberSource.paths.debug,
        },
      ];
    } else {
      filesConfig = [
        ...filesConfig,
        `${app.bowerDirectory}/jquery/dist/jquery.js`,
        {
          production: `${app.bowerDirectory}/ember/ember.prod.js`,
          development: `${app.bowerDirectory}/ember/ember.debug.js`,
        },
      ];
    }

    const filesToRemove = filesConfig.reduce((result, file) => {
      if (typeof file === 'string') {
        result.push(file);
      } else {
        if (file.development) {
          result.push(file.development);
        }
        if (file.production) {
          result.push(file.production);
        }
      }
      return result;
    }, []);
    removeOutputFiles(app, filesToRemove);

    filesConfig.forEach(fileConfig => {
      const options = {
        outputFile: vendorStaticFilepath,
      };
      if (typeof fileConfig === 'string') {
        app.import(fileConfig, options);
      } else {
        const importFiles = {};
        if (fileConfig.production !== undefined) {
          importFiles.production = fileConfig.production;
        }
        if (fileConfig.development !== undefined) {
          importFiles.development = fileConfig.development;
        }
        if (fileConfig.prepend !== undefined) {
          options.prepend = fileConfig.prepend;
        }
        app.import(importFiles, options);
      }
    });
  },
  updateFastBootManifest: function(manifest) {
    manifest.vendorFiles.unshift(vendorStaticFilepath);
    return manifest;
  },
};

module.exports.removeOutputFiles = removeOutputFiles;
function removeOutputFiles(app, filesToRemove) {
  // TODO: public API for ember-cli? maybe: https://github.com/ember-cli/ember-cli/pull/7060
  for (let i = 0; i < filesToRemove.length; i++) {
    let index = app._scriptOutputFiles[vendorFilepath].indexOf(
      filesToRemove[i],
    );
    if (index > -1) {
      app._scriptOutputFiles[vendorFilepath].splice(index, 1);
    }
  }
}
