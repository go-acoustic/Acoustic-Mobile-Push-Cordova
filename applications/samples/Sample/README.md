# Sample_Cordova
This project will use beta version of the libraries.

## Setup Application
1. Run the following command
```shell npm
npm i cordova-acoustic-mobile-push-beta
```

## Update CampaignConfig.json

After the plugin is installed, `CampaignConfig.json` file will be created if not found on the root of the project.

For production Campaign SDKs, set "useRelease" to true, false uses beta build.  Note: It's recommended to set the property to "false" during testing phase.

```shell json
  "useRelease": true,
```

## Set up your Android project
1. For Android Campaign SDK version, update "androidVersion" if you need a version which is not the latest. Otherwise leave it blank to get the latest.
```shell json
  "androidVersion": "x.x.x",
```
2. Copy your `google-services.json` file with your Google-provided FCM credentials to your android project folder: `platforms/android/app/google-services.json`.
3. Edit `CampaignConfig.json` file in `android` section and fill in the `baseUrl` and `appKey` provided by your account team.
```json
"baseUrl": "https://mobile-sdk-lib-XX-Y.brilliantcollector.com",
"appKey": {
  "prod": "INSERT APP KEY HERE"
},
```
4. Run node.js command from project's folder to automatically apply all updates in the json file
```text shell
node node_modules/cordova-acoustic-mobile-push-beta/scripts/installPlugins.js
```
5. Build Android application in cordova. This will create an APK file that you can run on your emulator at `applications/samples/Sample/platforms/android/app/build/outputs/apk/debug`.
```text shell
cordova build android
```

## Set up your iOS project
> 📘 Note:
> 
> The iOS Simulator is unable to handle push messages.
1. For iOS Campaign SDK version, update "iOSVersion" if you need a version which is not the latest. Otherwise leave it blank to get the latest.
```shell json
  "iOSVersion": "x.x.x",
```
2. Open the iOS project in Xcode.
3. Fix up the `bundle ID and signing` to use a bundle ID and profile with appropriate capabilities.
4. Add the `Push Notification` capability to your project: Go to **Signing & Capabilities**, Click **+Capability **, and select **Push Notification**.
5. Turn on the `Location Updates` background mode to your project: Go to **Signing & Capabilities** and check **Location Updates** checkbox.
6. Edit `CampaignConfig.json` file in `iOS` section and fill in the `baseUrl` and `appKey` provided by your account team.

```json
"baseUrl": "https://mobile-sdk-lib-XX-Y.brilliantcollector.com",
"appKey": {
  "dev": "INSERT APP KEY HERE",
  "prod": "INSERT APP KEY HERE"
},
```
7. Run node.js command from project's folder to automatically apply all updates in the json file
```text shell
node node_modules/cordova-acoustic-mobile-push-beta/scripts/installPlugins.js
```
8. Build iOS application in cordova
```text shell
cordova build ios
```
9. Launch Android app.
```text shell
cordova run ios
```
# License
License files can be read [here](https://github.com/Acoustic-Mobile-Push/SampleCode_AcousticMobilePush_Android_java/tree/beta/license)
