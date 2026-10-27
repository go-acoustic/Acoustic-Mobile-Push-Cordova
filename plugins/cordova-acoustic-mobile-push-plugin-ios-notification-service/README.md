# Acoustic Campaign - Cordova Plugin

Campaign plugin has been published to NPM for Cordova apps. Add the plugin with 'npm' to start configuring basic or advanced mobile app messaging features using an unified configuration file called 'CampaignConfig.json' for both iOS and Android apps.

Please review base plugin at https://www.npmjs.com/package/cordova-acoustic-mobile-push for instructions.

## Using the extension in a Cordova app

The plugin adds the `AcousticMobilePushNotification` pod. The Notification Service Extension target itself is created in Xcode:

1. Add a Notification Service Extension target (Objective-C) and make its class a subclass of `MCENotificationService`.
2. Add `AcousticMobilePushNotification` and `AcousticMobilePush` to the Podfile target of the extension, at the same version as the app.
3. Add `MceConfig.json` (with the same `appKey` and `baseUrl` as the app) to the Resources of the extension target. The SDK reads the app key from the config of the bundle it runs in; without it the extension crashes on every push.
4. Give the app and the extension the same App Group and the same Keychain Sharing group (the Capabilities of both targets).
5. Tell the app which App Group to use, in the `config.xml` of your project:

```xml
<platform name="ios">
    <preference name="appGroup" value="group.com.example.myapp" />
</platform>
```

On a real device the SDK takes the App Group from the provisioning profile, so step 5 is optional there. A simulator build has no provisioning profile: without the `appGroup` preference the app keeps its data in its own container, the extension finds no registration in the shared group and reports nothing (certified push, media attachments).

