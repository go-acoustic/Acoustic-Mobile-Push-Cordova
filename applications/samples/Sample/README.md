# Sample_Cordova
This project will use beta version of the libraries.

## Android Setup
1. Before you can build the sample app for Android, you'll need to generate a `google-services.json` file from Google at https://firebase.google.com/docs/android/setup#add-config-file. To do that, setup an Android app in Firebase and download the `google-services.json`. The Android app's name must be `co.acoustic.mobile.push.samples.android`.
1. Place the `google-services.json` in this repository at `applications/samples/Sample`.

### Might remove below
## iOS Setup
### Update MceConfig.json
Update the values in `SampleCode_AcousticMobilePush_Android_java/Demo/app/src/main/assets/MceConfig.json` file.

## Run Sample Application
1. Open a terminal and navigate to `applications/samples/Sample`.
1. In the line beginning with `cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push` in `postinstall_cordova.sh`, configure the Acoustic SDK to your app's requirements. You will need to modify at least the app keys and the server URL.
1. Run `npm i`.

### Android
1. Run `cordova build android`. This will create an APK file that you can run on your emulator at `applications/samples/Sample/platforms/android/app/build/outputs/apk/debug`.

### iOS
1. Run `cordova build ios`. This will build application for iOS.
1. Run `cordova run ios`. This will run application for iOS on the simulator.

# License
License files can be read [here](https://github.com/Acoustic-Mobile-Push/SampleCode_AcousticMobilePush_Android_java/tree/beta/license)
