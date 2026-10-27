# Acoustic Campaign - Cordova Plugin

## Install Acoustic Campaign Cordova plug-in instructions

[Add-the-cordova-sdk-to-your-app](https://developer.goacoustic.com/acoustic-campaign/docs/add-the-cordova-sdk-to-your-app)


## Session timeout on iOS

The SDK ends a session when the app comes back after the session timeout, 20 minutes by default. To change it in a
Cordova app, set the `sessionTimeout` preference (minutes) in the `config.xml` of the app, or in the `iOS` section of
`CampaignConfig.json` when you use `installPlugins.js`:

```xml
<platform name="ios">
    <preference name="sessionTimeout" value="5" />
</platform>
```

## Android requirements

The Android SDK 3.11.3 that these plugins pull in needs `compileSdk` 37. With cordova-android, set it in the `config.xml` of your app:

```xml
<platform name="android">
    <preference name="android-compileSdkVersion" value="37" />
    <preference name="android-targetSdkVersion" value="37" />
</platform>
```

A project that compiles against 36 or lower fails in `checkDebugAarMetadata` with "requires libraries and applications that depend on it to compile against version 37 or later". The samples in `applications/samples` already set this.

## Using the plugins with Capacitor

The Cordova plugins work in a Capacitor app (up to Capacitor 8) through Capacitor's Cordova compatibility layer.
This package has a setup script, `scripts/capacitorSetup.js`, and an optional typed, Promise-based wrapper,
`capacitor/acoustic-campaign.ts`.

- Guide: https://github.com/go-acoustic/Acoustic-Mobile-Push-Cordova/blob/master/documentation/CAPACITOR.md
- Setup script: `node node_modules/<this package>/scripts/capacitorSetup.js --help`
- Wrapper to copy into your app: `node_modules/<this package>/capacitor/acoustic-campaign.ts`

## Building the sample app
Sample is located at https://github.com/go-acoustic/Acoustic-Mobile-Push-Cordova/tree/master/applications/samples/Sample

[Instructions](https://github.com/go-acoustic/Acoustic-Mobile-Push-Cordova/blob/master/applications/samples/Sample/README.md)
