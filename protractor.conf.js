require('ts-node/register');
const path = require('path');
const ROOT = path.resolve(__dirname);
const rootpath = path.join.bind(path, ROOT);

exports.config = {
  baseUrl: 'http://minesweeperonline.com/',
  specs: [ rootpath('miner/**/**.e2e.ts') ],
  exclude: [],
  framework: 'jasmine2',
  allScriptsTimeout: 600000,
  jasmineNodeOpts: {
    showTiming: true,
    showColors: true,
    isVerbose: false,
    includeStackTrace: false,
    defaultTimeoutInterval: 600000
  },
  directConnect: true,
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['show-fps-counter=true']
    }
  },
  onPrepare: function() {
    browser.ignoreSynchronization = true;
  },
  onComplete: function() {
    browser.sleep(5000);
  }
};
