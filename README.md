# captive-portal-bypass

A tool for MacOS to automatically bypass captive portals.

## Installation

* Install Node.js 6+.
* Run `npm install` to install dependencies.
* Copy `captive.portal.bypass.plist` to `~/Library/LaunchAgents/` and modify `ProgramArguments`
  to make path to `index.js` correct. This is required to run the script on change of WiFi state.
* Rename `config-example.yaml` to `config.yaml`.
* Modify `config.yaml` according to the captive portal you want to bypass - provide correct URLs,
  form element selectors and credentials.
* Run `node index.js` to make sure everything works fine.
* Run `launchctl load ~/Library/LaunchAgents/captive.portal.bypass.plist` to start monitoring WiFi
  state.

Tested on MacOS Sierra.
