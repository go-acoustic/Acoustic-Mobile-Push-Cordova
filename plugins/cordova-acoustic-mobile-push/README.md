# Acoustic Campaign - Cordova Plugin

Campaign plugin has been published to NPM for Cordova apps. Add the plugin with 'npm' to start configuring basic or advanced mobile app messaging features using an unified configuration file called 'CampaignConfig.json' for both iOS and Android apps.

> 📘 Note:
> 
> Beta build plugin ends with '-beta' in the name of the package.

> 🚧 Warning:
> 
> To transmit sensitive information, encrypt the inbox, in-app, and mobile app messages data before sending it and decrypt the data in memory on the device.

## Install Acoustic Campaign Cordova plug-in

1. Add `cordova-acoustic-mobile-push-beta` from the project.

```shell npm
npm i cordova-acoustic-mobile-push-beta
```

## Update CampaignConfig.json

After the plugin is installed, `CampaignConfig.json` file will be created if not found on the root of the project. Example screenshot of the file and the json properties:

![](https://files.readme.io/53a3b4b-image.png)

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
5. Build Android application in cordova
```text shell
cordova build android
```
6. Launch Android app.
```text shell
cordova run android
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

## Optional: Integrating the iOS notification service

The iOS notification service requires separate provisioning. This plug-in is required if you need to access **push received events**, **dynamic action categories**, and **media attachments**. 

1. Edit `CampaignConfig.json` file and set to `true` to `cordova-acoustic-mobile-push-plugin-ios-notification-service-beta`
```json
"cordova-acoustic-mobile-push-plugin-ios-notification-service-beta": true,
```
2. Run node.js command from project's folder to automatically apply all updates in the json file
```text shell
node node_modules/cordova-acoustic-mobile-push-beta/scripts/installPlugins.js
```
3. Build iOS application in cordova which will also update cocoapod depedencies.
```text shell
cordova build ios
```
3. Add a new `Notification Service Extension` target:  
   a. In your XCode project, go to the **File** menu and select **New > Target**. A dialog box opens.  
   b. In the dialog box, select **iOS** at the top and then select **Notification Service Extension**.  
   c.  Select **Next**, enter the extension name `NewAppNotificationService`, and choose **Objective-C **as  
   **Language**.  
   d. Click **Finish**. If a dialog box opens, select **Activate**. The new target is added to the project. Xcode created a new folder with files in it.  
   e. Change the new target bundle identifier prefix and use `.notification`.  
   f. Verify that the new target has the same iOS version as the application target. SDK minimum supported version is 13.0.  
   g. Add the _MceConfig.json_ file to the **Notification Service** target. Open the file and check the notification service target membership in the **Target Membership** of the **File Inspector** in the Xcode pane.  
   h. Add `-ObjC` to the **Other Linker Flags** build options for the Notification Service.  
   d. Add `App Group` capability to both your notification service extension and Application target. Be sure to use the same app group as the main application.  
   e. Add the `Keychain Sharing capability` to both your notification service extension and Application target. Be sure to use the same value as the main application.  
   f. Replace the contents of _NotificationService.m_ and _NotificationService.h_ with the following code:

```javascript NotificationService.h
// NotificationService.h
#import <UserNotifications/UserNotifications.h>
#import <AcousticMobilePushNotification/AcousticMobilePushNotification.h>

@interface NotificationService : MCENotificationService

@end
```
```javascript NotificationService.m
// NotificationService.m
#import "NotificationService.h"

@implementation NotificationService

@end
```

## Add other Campaign features

1. To add other features, update the 'plugins' section in the 'CampaignConfig.json' file.  Below is default recommended settings:

```Text CampaignConfig.json
 "plugins": {
    "Please note": "<true/false>, for cordova build.  True for release build, false for beta build",
    "useRelease": false,

    "Required Mobile-Push plugins": "<true/false>, enable or disable plugin",
    "cordova-acoustic-mobile-push-beta": true,
    "cordova-acoustic-mobile-push-plugin-ios-notification-service-beta": true,
    "cordova-acoustic-mobile-push-plugin-inapp-beta": true,
    "cordova-acoustic-mobile-push-plugin-inbox-beta": true,

    "Optional Mobile-Push plugins": "<true/false>, enable or disable plugin",
    "cordova-acoustic-mobile-push-plugin-action-menu-beta": true,
    "cordova-acoustic-mobile-push-plugin-beacon-beta": true,
    "cordova-acoustic-mobile-push-plugin-calendar-beta": true,
    "cordova-acoustic-mobile-push-plugin-dial-beta": true,
    "cordova-acoustic-mobile-push-plugin-displayweb-beta": true,
    "cordova-acoustic-mobile-push-plugin-geofence-beta": true,
    "cordova-acoustic-mobile-push-plugin-location-beta": true,
    "cordova-acoustic-mobile-push-plugin-passbook-beta": true,
    "cordova-acoustic-mobile-push-plugin-snooze-beta": true
  },
```

2. Run node.js command to automatically install from project folder

```Text shell
node node_modules/react-native-acoustic-mobile-push/postinstall.js ./
```

## Building the sample app
[Instructions](./applications/samples/Sample/README.md)

## Building on a new sample Cordova application
1. Create your Cordova application based from https://cordova.apache.org/docs/en/latest/guide/cli/index.html
```Text shell
cordova create hello com.example.hello HelloWorld
```

2. Move into application and add supported platforms for iOS and Android
```Text shell
cd hello
cordova platform add ios
cordova platform add android
```

3. Additional setup for iOS, edit config.xml and adjust or add new minimal deployment target for iOS from iOS 11.0 to iOS 13.0 which is required for this plugin.
```Text shell
<platform name="ios">
    <preference name="deployment-target" value="13.0" />
</platform>
```
**Example config.xml**
```Text shell
<?xml version='1.0' encoding='utf-8'?>
<widget id="co.acoustic.mobile.push.samples.android" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>HelloCordova</name>
    <description>Sample Apache Cordova App</description>
    <author email="dev@cordova.apache.org" href="https://cordova.apache.org">
        Apache Cordova Team
    </author>
    <content src="index.html" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <platform name="ios">
        <preference name="deployment-target" value="13.0" />
    </platform>
</widget>
```

4. Build app
```Text shell
cordova build
```

5. Add https://www.npmjs.com/package/cordova-acoustic-mobile-push-beta plugin
```Text shell
npm i cordova-acoustic-mobile-push-beta
```

6. Android setup, copy your **google-services.json** file with your Google-provided FCM credentials to your android project folder: **platforms/android/app/google-services.json**.

7. Android setup, edit **CampaignConfig.json** file in **android** section and fill in the **baseUrl** and **appKey** provided by your account team.

8. iOS setup, open your **platforms/ios/HelloWorld.xcworkspace** with Xcode

9. iOS setup, fix up the **bundle ID** and signing to use a **bundle ID** and profile with appropriate **capabilities**.

10. iOS setup, add the **Push Notification capability** to your project: 
* Go to Signing & Capabilities
* Click **+Capability**
* Select **Push Notification**

11. iOS setup, turn on the Location Updates background mode to your project: 
* Go to **Signing & Capabilities**
* check **Location Updates** checkbox

12. iOS setup, edit **CampaignConfig.json** file in iOS section and fill in the **baseUrl** and **appKey** provided by your account team.

13. iOS setup, run which will setup all the plugin options selected in **CampaignConfig.json** file
```Text shell
node node_modules/cordova-acoustic-mobile-push-beta/scripts/installPlugins.js
```

14. iOS setup, run cordova to build with new plugins installed
```Text shell
cordova build 
```
