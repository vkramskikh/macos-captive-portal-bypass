const exec = require('child_process').exec;
const request = require('request');
const notify = require('osx-notifier');
const yaml = require('js-yaml');
const fs = require('fs');

function getWifiSSID() {
  return new Promise((resolve, reject) => {
    exec(
      '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I',
      (err, stdout) => {
        if (err) return reject(err);
        const match = stdout.match(/\bSSID: (.*?)$/m);
        if (!match) return resolve(match);
        const ssid = match[1];
        return resolve(ssid);
      }
    );
  });
}

function isCaptivePortalBypassNeeded() {
  return new Promise((resolve, reject) => {
    request('http://captive.apple.com/hotspot-detect.html', (error, response, body) => {
      if (error) return resolve(error);
      return resolve(body.indexOf('Success') === -1);
    });
  });
}

function killCaptiveNetworkAssistant() {
  exec('pkill "Captive Network Assistant"');
}

const config = yaml.safeLoad(fs.readFileSync(__dirname + '/config.yaml', 'utf8'));

getWifiSSID().then((ssid) => {
  const ssidConfig = config.find((configEntry) => configEntry.ssid === ssid);
  if (ssidConfig) {
    isCaptivePortalBypassNeeded().then((result) => {
      if (result) {
        const Nightmare = require('nightmare');
        const nightmare = Nightmare({
          loadTimeout: 5000,
          waitTimeout: 5000,
          typeInterval: 10,
          dock: ssidConfig.showBrowserWindow,
          show: ssidConfig.showBrowserWindow
        });
        nightmare.goto(ssidConfig.url);
        if (ssidConfig.loginRequiredSelector) {
          nightmare.exists(ssidConfig.loginRequiredSelector)
        }
        nightmare.then((loginRequiredSelectorExists) => {
          if (loginRequiredSelectorExists !== false) {
            for (const selector of Object.keys(ssidConfig.credentials)) {
              nightmare.type(selector, ssidConfig.credentials[selector]);
            }
            nightmare.click(ssidConfig.submitSelector);
            if (ssidConfig.loginSuccessSelector) {
              nightmare.wait(ssidConfig.loginSuccessSelector);
            }
          }
        })
        .then(killCaptiveNetworkAssistant)
        .then(() => nightmare.end())
        .catch((error) => {
          notify({
            type: 'fail',
            title: 'Captive Portal Bypass Error',
            message: String(error)
          });
          console.error(error);
          nightmare.end();
        });
      }
    });
  }
});
