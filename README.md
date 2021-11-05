# Mobile Customer Engagement - Cordova Plugin

This repository contains the Cordova Plugin and sample apps for IBM Mobile Customer Engagement.

## Building the plugins
Plugins are structured like so:
* `assets` - Images, CSS, or other non-code files
* `scripts` - Hooks to run at specific points during the installation process. Configured in `config.xml`.
* `src` - Android and iOS plugin source files
* `types` - TS/JS types for the publicly-exposed plugin functions
* `www`
    * `ts` - TS source code files
    * `js` - Compiled JS files
* `index.d.ts` - Type file containing all types used in the plugin. Should mostly be comprised of imports of types from the `types` folder.
* `package.json` - NPM package file
* `plugin.xml` - Cordova plugin configuration file
* `tsconfig.json` - TypeScript configuration file

To build the plugins, `cd` into the plugins directory and run `sh build.sh`.

## Building the sample app
1. Before you can build the sample app, you'll need to generate a `google-services.json` file from Firebase. To do that, setup an Android app in Firebase and download the `google-services.json`. The Android app's name must be `co.acoustic.mobile.push.samples.android`.
1. Place the `google-services.json` in this repository at `applications/samples/Sample`.
1. Open a terminal and navigate to `applications/samples/Sample`.
1. In the line beginning with `cordova plugin add file:../../../plugins/co.acoustic.mobile.push.sdk` in `postinstall_cordova.sh`, configure the Acoustic SDK to your app's requirements. You will need to modify at least the app keys and the server URL.
1. Run `npm i`.
1. Run `cordova build android`. This will create an APK file that you can run on your emulator at `applications/samples/Sample/platforms/android/app/build/outputs/apk/debug`.

#### Release History: 
