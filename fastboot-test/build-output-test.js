'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-fs'));

const glob = require('glob');

const AddonTestApp = require('ember-cli-addon-tests').AddonTestApp;

describe('it builds', function() {
  this.timeout(300000);

  let app;

  before(function() {
    app = new AddonTestApp();

    return app.create('dummy', {
      'fixturesPath' : 'fastboot-test/fixtures'
    })
    .then(addDependencies);
  });

  it('Verify build output files', function() {
    return app.runEmberCommand('build')
      .then(function() {
        expect(app.filePath('dist/index.html')).to.be.a.file();
        expect(app.filePath('dist/index.html')).to.have.content.that.match(
          /<!-- EMBER_CLI_FASTBOOT_BODY -->/
        );
        expect(app.filePath('dist/assets/dummy.js')).to.be.a.file();
        expect(app.filePath('dist/assets/vendor.js')).to.be.a.file();
        expect(app.filePath('dist/assets/dummy-fastboot.js')).to.be.a.file();
        expect(app.filePath('dist/assets/vendor-static.js')).to.be.a.file();
        expect(app.filePath('dist/package.json')).to.be.a.file();
        expect(app.filePath('dist/package.json')).to.have.content.that.match(
          /"vendorFiles":\["assets\/vendor-static\.js"/, 'vendor-static.js should be included as first item in vendorFiles array');
      });
  });

  it('produces a production build with --environment=production', function() {
    return app.runEmberCommand('build', '--environment=production')
      .then(function() {
        expect(app.filePath('dist/index.html')).to.be.a.file();
        expect(app.filePath('dist/index.html')).to.have.content.that.match(
          /<!-- EMBER_CLI_FASTBOOT_BODY -->/
        );
        expect(find('dist/assets/vendor-static-*.js')).to.be.a.file();
        expect(find('dist/assets/vendor-static-*.js')).to.match(/vendor-static-\w{32}/, 'file name should contain MD5 fingerprint');

        expect(find('dist/assets/dummy-fastboot-*.js')).to.be.a.file();
        expect(find('dist/assets/dummy-fastboot-*.js')).to.match(/dummy-fastboot-\w{32}/, 'file name should contain MD5 fingerprint');
      });
  });

  function find(globPath) {
    globPath = app.filePath(globPath);
    let files = glob.sync(globPath);

    expect(files.length).to.equal(1, globPath);

    return files[0];
  }

  function addDependencies(app) {
    app.editPackageJSON(function(pkg) {
      pkg['devDependencies']['ember-cli-fastboot'] = "*";
    });
    return app.run('npm', 'install');
  }

});
