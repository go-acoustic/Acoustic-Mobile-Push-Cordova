# Using the Acoustic Campaign plugins with Capacitor

The Cordova plugins in this repository run in a Capacitor 8 app through Capacitor's Cordova
compatibility layer. There is no separate Capacitor plugin. Capacitor does not run Cordova hooks and
does not pass `--variable` values, so a few settings that Cordova generates for you have to be added
to the native projects by hand. This guide lists them.

## Verified setup

| Item | Version |
|---|---|
| Capacitor | 8.5 (CLI, core, Android, iOS) |
| Node.js | 22 or newer (the Capacitor 8 CLI refuses to run on Node 20) |
| Android | JDK 21, Android Gradle plugin 8.13, `compileSdk` 37, emulator API 36 |
| iOS | Xcode 26.5, iOS simulator, **CocoaPods** package manager |
| Plugins | `cordova-acoustic-mobile-push`, `-plugin-inapp`, `-plugin-inbox`, `-plugin-location`, `-plugin-geofence`, `-plugin-beacon`, `-plugin-snooze`, `-plugin-calendar`, `-plugin-displayweb` (3.9.166); `-plugin-passbook` and `-plugin-action-menu` (iOS only) |
| Native SDKs | Android 3.11.3, iOS `AcousticMobilePushDebug` 3.10.12 |

Verified on an Angular 20 / Ionic 8 sample app: the app builds, the SDK starts, the device registers
with the Campaign server and receives a push token on both platforms. On the iOS simulator a push
in the Acoustic payload format (sent with `xcrun simctl push`) is shown in the foreground and in the
background, and tapping it runs the `notification-action` (URL) and reports events to the server.
Release builds were verified on both platforms (Android with R8, iOS Release configuration).
All of the plugins above install together, build on both platforms and load at run time: the JS
objects exist, and the location, geofence and beacon calls return values from the native code on
Android and on the iOS simulator. Capacitor skips `passbook` and `action-menu` on Android because
they are iOS only. The snooze, calendar, displayweb, passbook and action-menu plugins have no JS API
(they register actions inside the SDK), so only loading was checked, not running the actions
themselves.
Not verified: a push sent from the Campaign server, push delivery and tap on Android, geofence or
beacon events, the actions of the five action plugins, and the Notification Service Extension at run
time (it builds and installs, but was not seen processing a push).

## 1. Install

```bash
npm install cordova-acoustic-mobile-push-beta \
            cordova-acoustic-mobile-push-plugin-inapp-beta \
            cordova-acoustic-mobile-push-plugin-inbox-beta
```

Install only the plugins you use. When installing from a local checkout of this repository, build
the TypeScript first (`npm install && tsc` inside each plugin directory), because `www/js` is
generated and `npx cap sync` fails without it.

Add the platforms:

```bash
npx cap add android
npx cap add ios --packagemanager CocoaPods
npx cap sync
```

Use CocoaPods for iOS. The Cordova plugins declare the Acoustic SDK as a CocoaPod, and Capacitor 8
creates Swift Package Manager projects by default.

### CocoaPods sources

CocoaPods trunk becomes read-only on 2 December 2026 and receives no later versions of the Acoustic
pods. New versions are published to the Acoustic spec repo, so `ios/App/Podfile` lists it ahead of
the CocoaPods CDN:

```ruby
source 'https://github.com/go-acoustic/PodSpecs.git'
source 'https://cdn.cocoapods.org/'
```

`scripts/capacitorSetup.js` adds these lines. Keep the CDN line: declaring any source turns off the
CocoaPods default, and the other pods resolve from it. `npx cap sync` rewrites only the
`capacitor_pods` block, so the lines stay.

SPM does not work with these plugins as they are. Checked with Capacitor 8.5 and Xcode 26:

- Capacitor generates one `Package.swift` per plugin from `plugin.xml`. It ignores the `<pod>`
  entry, so the generated package has no dependency on the Acoustic SDK and the plugin sources
  fail on `#import <AcousticMobilePush/AcousticMobilePush.h>`.
- The SDK is published as Swift packages (`go-acoustic/AcousticMobilePushDebug-SP`,
  `AcousticMobilePush-SP`, and the `Notification` variants). Their newest tag is 3.9.47, while
  the pod is 3.10.x. The `main` branch points at 3.10.8.
- With a hand-edited generated `Package.swift` (dependency on `AcousticMobilePushDebug-SP`
  `branch: "main"`, `.linkedLibrary("sqlite3")`), the core plugin compiled for the iOS
  Simulator after one source change: `AppDelegate+MCE.h` imports `<Cordova/AppDelegate.h>` when
  it is available (in the plugin since this branch). Not checked: the other ten plugins, a full app
  build, running the app, the Notification Service Extension, and whether the AppDelegate hook
  works with the static linking SPM uses.
- `cap sync` regenerates those files, so the edit does not last. A durable fix needs a
  `Package.swift` shipped in each plugin (Capacitor reads it when `plugin.xml` has
  `<platform name="ios" package="swift">`), which also changes how Cordova treats the plugin and was
  not tried.

## Automatic setup

After `npx cap sync`, one command applies everything in sections 2 and 3 below, except the items
marked "by hand":

```bash
node node_modules/cordova-acoustic-mobile-push-beta/scripts/capacitorSetup.js \
  --server-url https://mobile-sdk-lib-XX-Y.brilliantcollector.com \
  --android-app-key YOUR_ANDROID_APP_KEY \
  --ios-dev-key YOUR_IOS_DEV_APP_KEY --ios-prod-key YOUR_IOS_PROD_APP_KEY
npx cap sync
```

Options: `--log-level` (default `error`), `--project DIR` (default: current directory) and
`--dry-run` (lists the changes without writing). The script is safe to run again: it skips what is
already in place and keeps an existing `MceConfig.json` and `App.entitlements`. The iOS part edits
the Xcode project with the `xcodeproj` Ruby gem, which CocoaPods installs.

It does: Gradle version properties and the release resource check, `appkey`/`senderid`, the manifest
(application class, server, log level), R8 rules, `MceConfig.json` and `App.entitlements` added to
the App target, `UIBackgroundModes`, the Acoustic spec repo as a `Podfile` source (see
[CocoaPods sources](#cocoapods-sources)), and `ios.handleApplicationNotifications: false` in
`capacitor.config`. It also reads `package.json` for the plugins you installed: for location,
geofence or beacon it adds the `location` section to `MceConfig.json`, the location usage strings
and the `fetch`, `location` and Bluetooth background modes to `Info.plist` (pass
`--beacon-uuid UUID` when the beacon plugin is installed); for calendar it adds
`NSCalendarsUsageDescription`; for `ios-notification-service` it creates the Notification Service
Extension target (see below). The default usage texts are the ones the Cordova plugins use, so
change them in `Info.plist` for your app.

By hand: `google-services.json` (the script warns when it is missing or has no client for your
`applicationId`), the push capability for App Store builds (`aps-environment` is `development`),
and code signing.

Verified on a new Capacitor 8.5 project: after the script, `assembleDebug`, `assembleRelease` and an
iOS simulator build succeed with no other edits.

## 2. Android

### Gradle version properties

The Android SDK dependencies in the plugin read their versions from project properties that the
Cordova hooks normally write into `platforms/android/build.gradle`. Add them to
`android/build.gradle`:

```groovy
allprojects {
    project.ext {
        mobilePushVersion = "3.11.3"
        androidxLibVersion = "1.6.0"
        playServicesBaseVersion = "18.3.0"
        playServicesLocationVersion = "21.0.1"
        firebaseCoreVersion = "19.0.2"
        firebaseMessagingVersion = "22.0.0"
        securityCryptoVersion = "1.1.0"
    }
}
```

The values above match `scripts/installPlugins.js` in `cordova-acoustic-mobile-push`. Without them
the build stops with `Cannot get property 'androidxLibVersion' on extra properties extension`.

### App key and sender id

In `android/app/src/main/res/values/strings.xml`:

```xml
<string name="appkey">YOUR_ANDROID_APP_KEY</string>
<string name="senderid"></string>
```

### Manifest

Start the SDK through its application class and set the server and log level explicitly. In
`android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          xmlns:tools="http://schemas.android.com/tools">

    <application
        android:name="co.acoustic.mobile.push.sdk.js.MceJsonApplication"
        tools:replace="android:name"
        ... >

        <meta-data android:name="mceServer"
                   android:value="https://mobile-sdk-lib-XX-Y.brilliantcollector.com"
                   tools:replace="android:value" />
        <meta-data android:name="loglevel" android:value="verbose"
                   tools:replace="android:value" />
    </application>
</manifest>
```

Replace the server URL with the one supplied for your account.

### Firebase

Put your `google-services.json` in `android/app/`. Its package name must equal the app's
`applicationId`. Without it the log shows `FirebaseApp initialization unsuccessful` and the device
never gets a push token. Capacitor's template applies the `google-services` plugin only when the
file exists.

### Notification permission (Android 13 and later)

The Acoustic plugins only declare `POST_NOTIFICATIONS` in the manifest. From Android 13 (API 33) the app has to ask
the user for it at runtime; without it a push arrives but no notification is shown. Ask once at start, on Android only
(iOS asks when the SDK registers for push). With `@capacitor/local-notifications`:

```ts
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') return true;
  let { display } = await LocalNotifications.checkPermissions();
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    ({ display } = await LocalNotifications.requestPermissions());
  }
  return display === 'granted';
}
```

Do not use `@capacitor/push-notifications` for this: it brings its own FCM message service next to the one of the
Acoustic SDK. `@capacitor/local-notifications` adds none. The samples do this (`SampleCapacitorAngular`:
`AcousticService.requestNotificationPermission()`).

### Build

```bash
cd android && JAVA_HOME=<jdk-21> ./gradlew assembleDebug
```

### Release build (R8)

The Acoustic SDK ships no consumer ProGuard rules and loads some of its own classes by name, so a
release build with `minifyEnabled true` needs three additions. Without them R8 removes classes the
SDK looks up at run time (`ClassNotFoundException` for `InAppMessageProcessor`, `InboxMessageAction`,
`GooglePlayServicesTest`), and obfuscated class names that the SDK stores in its preferences can
break the database after an app update.

`android/app/proguard-rules.pro`:

```
-keep class co.acoustic.mobile.push.** { *; }
-dontwarn com.google.android.gms.location.**
-dontwarn com.android.installreferrer.**
-dontwarn org.sqlite.**
```

`android/build.gradle` (the library module that Capacitor generates for Cordova plugins references
`@string/appkey`, which only exists in the app module, so its resource check fails in release):

```groovy
subprojects {
    afterEvaluate {
        tasks.matching { it.name == 'verifyReleaseResources' }.configureEach { enabled = false }
    }
}
```

Verified: `assembleRelease` with `minifyEnabled true` and `shrinkResources true` builds, and a signed
APK on a clean install starts the SDK, registers and obtains a push token with no errors in logcat.

## 3. iOS

### Configuration file

On iOS the plugin normally reads its settings from `config.xml`, which Capacitor does not fill in.
If `config.xml` has no `baseUrl`, the plugin loads `MceConfig.json` from the app bundle instead.
Create `ios/App/App/MceConfig.json` and add it to the **App** target's resources in Xcode:

```json
{
  "appDelegateClass": "App.AppDelegate",
  "baseUrl": "https://mobile-sdk-lib-XX-Y.brilliantcollector.com",
  "appKey": { "dev": "YOUR_IOS_DEV_APP_KEY", "prod": "YOUR_IOS_PROD_APP_KEY" },
  "invalidateExistingUser": false,
  "autoReinitialize": true,
  "autoInitialize": true,
  "sessionTimeout": 20,
  "loglevel": "error",
  "logfile": false
}
```

`appKey.dev` is used for development builds and `appKey.prod` for production builds. The full list
of options, including location, geofence and iBeacon, is in
`plugins/cordova-acoustic-mobile-push/postinstall/ios/MceConfig.json`. Keep the `location` section
only if you install the location, geofence or beacon plugins.

No code is needed in `AppDelegate.swift`. The plugin attaches itself to the app's delegate at
launch, starts the SDK, asks for notification permission and forwards the APNs token. If your
delegate already implements `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` and
posts Capacitor's `capacitorDidRegisterForRemoteNotifications` notification, the plugin listens to
that notification instead.

### Let the SDK handle notifications

By default Capacitor makes its own `NotificationRouter` the `UNUserNotificationCenter` delegate and
replaces the SDK's delegate. The SDK then neither shows pushes while the app is open nor handles a
tap on a push (no action, no event). Turn the Capacitor router off in `capacitor.config.ts`:

```ts
const config: CapacitorConfig = {
  // ...
  ios: { handleApplicationNotifications: false }
};
```

Run `npx cap sync ios` afterwards. This also turns off Capacitor's own `@capacitor/push-notifications`
and `@capacitor/local-notifications` handling on iOS, so do not use them for notifications on iOS together with these
plugins. Calling `@capacitor/local-notifications` on Android only, to ask for the permission, is fine (see above).

### Xcode project settings

1. Add the **Push Notifications** capability (adds `aps-environment` to the entitlements).
2. Add **Background Modes → Remote notifications** (`UIBackgroundModes` = `remote-notification`).
3. If you use location features, add `NSLocationWhenInUseUsageDescription`,
   `NSLocationAlwaysUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` to
   `Info.plist`. `npx cap sync` prints these as warnings.
4. Sign the app. The SDK keeps its ids in the Keychain, and a build with code signing disabled
   fails with `Keychain unarchive ... failed` and never registers. Local ("Sign to Run Locally")
   signing is enough for the simulator.

### Build

```bash
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```

### Notification Service Extension (iOS)

The Notification Service Extension downloads media attachments and adds action buttons to Acoustic
push messages. In Cordova it is also set up by hand: the plugin
`cordova-acoustic-mobile-push-plugin-ios-notification-service` only adds the
`AcousticMobilePushNotification` pod, and the target is created in Xcode following the Acoustic
documentation. No hook creates it, so nothing is lost under Capacitor.

When that plugin is in `package.json`, `capacitorSetup.js` does the Xcode work for you:

- creates the `NotificationService` target (Objective-C, bundle id `<app id>.NotificationService`,
  `-ObjC`, same deployment target) and embeds it in the app;
- writes `NotificationService.h/.m` (an empty subclass of `MCENotificationService`, as in
  Acoustic's sample app), `Info.plist` and `NotificationService.entitlements`;
- adds `MceConfig.json` to the extension target too. The SDK reads the app key from the config of the
  bundle it runs in; without it the extension crashes on every push and no `push/received` event is
  reported. Running the script again repairs a project made before this;
- adds the app group `group.<app id>` and the keychain group `$(AppIdentifierPrefix)<app id>` to
  both `App.entitlements` and the extension entitlements. The SDK shares its data between the app
  and the extension through them;
- adds a `target 'NotificationService'` block with `AcousticMobilePushNotificationDebug` and
  `AcousticMobilePushDebug` to the Podfile, both pinned to the same native iOS SDK version as the app
  (see the table at the top). Then run `pod update AcousticMobilePushNotificationDebug AcousticMobilePushDebug` in
  `ios/App`, not only `npx cap sync` or `pod install`: the first `npx cap sync` has already locked the Notification
  pod of the Cordova plugin at the latest version in `Podfile.lock`, and `pod install` stops with "could not find
  compatible versions" while the lock and the pin differ. The script prints a warning with this command when it finds
  such a lock.

For a release build switch both pods in the Podfile to the non-Debug names
(`AcousticMobilePushNotification`, `AcousticMobilePush`) and keep the version. The pod versions of
the app and the extension must match. For a real device, register the app group for both App IDs in your Apple
developer account and enable **App Groups** and **Keychain Sharing** for both targets in Xcode.

Verified: the project builds with the extension, the extension is embedded in `PlugIns/`, links the
SDK frameworks and is registered with the system on the iOS simulator. Not verified: that it runs
when a push arrives. `xcrun simctl push` did not start any Notification Service Extension in our
tests (this included an unrelated sample app that has one), so this needs a real device and a push
from the Campaign server.

## 4. Check that it works

- **Android:** `adb logcat | grep ACOUSTIC.MCE` shows `Sdk started`, then `SDK_REGISTERED` with a
  `userId` and `channelId`, then a `PUT .../registration/gcm/...` call.
- **iOS:** with `"logfile": true` the SDK writes `Library/co.acoustic.mobile-push/MCE.log` in the
  app container. Look for `POST .../registration/apns/...` returning 200, then
  `registrationState = token` after you allow notifications.

## Promises and types

`capacitor/acoustic-campaign.ts` in the core plugin (`node_modules/cordova-acoustic-mobile-push-beta/capacitor/acoustic-campaign.ts`,
`node_modules/cordova-acoustic-mobile-push/...` for the release package) wraps the plugins' global objects. Copy it into the app
(for example `src/app/acoustic-campaign.ts`):

```ts
import { AcousticCampaign } from './acoustic-campaign';

const reg = await AcousticCampaign.getRegistrationDetails();
const inbox = await AcousticCampaign.fetchInboxMessageId(id);
AcousticCampaign.setRegisteredActionCallback('myType', (action, payload) => { /* ... */ });
```

- One-shot queries return a Promise: registration details, app key, badge, safe area, `isRegistered`
  (as an object), inbox message fetch, in-app sync, location authorization, geofence and beacon queries.
- Calls with no result return a Promise that resolves at once. Listeners stay callbacks, because they
  can fire many times.
- A function of a plugin that is not installed rejects with a message naming the plugin.
- An app that draws an inbox message itself runs the action links of the message with
  `executeInboxAction(action, inboxMessageId)`; the SDK performs the action and reports the click event.
  The links of a template message are `<a action='{json}'>` (or `href="actionid:<key>"`), and the default Inbox
  screen listens for them with jQuery, which an Ionic/Angular app does not have.
- Silent data pushes and every other push that reaches the app are delivered to
  `setMessageReceivedCallback(cb)` (`MCEPlugin.setMessageReceivedCallback(cb)` in Cordova) as
  `{type, payload, subject?, message?, attribution?, mailingId?}`. On Android a push with an `alert` that has `type`
  and `payload` and no text is a data push: nothing is shown and the app gets the callback. A push that arrives while
  the app is not running is kept and delivered when the callback is registered; at most 50 messages are kept and
  the oldest ones are dropped. Nothing is kept, and nothing is built per push, until the app has registered the
  callback once, so apps that do not use it are not affected. `removeMessageReceivedCallback()` (the same name in
  Cordova) undoes the registration: the kept messages are deleted and nothing is kept again until the next
  `setMessageReceivedCallback`. On iOS
  the values are read from the `notification-action` (`type`, `value`) and `mce` (`attribution`, `mailingId`) parts of
  the push. Checked on an Android device and on the iOS simulator (the simulator does not deliver a silent push to the
  app, so the delegate method was called directly); not checked with a push delivered through APNs to an iPhone.
- Checked: the file compiles with `tsc --strict`, and its calls were run against mocked plugin
  objects. Not run in an app on a device.
- Not wrapped: inbox and in-app display helpers (`MCEInbox`, `MCEInAppImage` and similar), icon and
  sound setters (Android), `setCategoryCallbacks`, `registerInAppTemplate`, `executeInAppRule`.

## Changing the native SDK versions

The versions in the table at the top are the validated ones and are pinned in the Capacitor samples.
To try another version without editing files:

- Android: `./gradlew -PmobilePushVersion=<version> ...` (or `mobilePushVersion=<version>` in
  `gradle.properties`);
- iOS: `ACOUSTIC_IOS_SDK_VERSION=<version> pod update AcousticMobilePushDebug AcousticMobilePushNotificationDebug`
  in `ios/App` (the second pod is only in the lock when the Notification Service Extension is set up).

`scripts/capacitorSetup.js` takes the versions it writes (the Android version property and the Notification
Service pods) from `androidVersion` and `iOSVersion` of the `CampaignConfig.json` in your project, as
the Cordova hooks do. An empty value means the latest version (Android `+`, iOS no version in the Podfile).

To move every pin of the repository (plugins, samples, this table) to one version, run
`node scripts/updateNativeSdkVersions.js --android <version|latest> --ios <version|latest>`
(add `--dry-run` to only list the changes), then run `pod update AcousticMobilePushDebug` in the
`ios/App` folder of the Capacitor samples to refresh `Podfile.lock` (add `AcousticMobilePushNotificationDebug` for a
project with the Notification Service Extension).

## Known limitations

- iOS works with CocoaPods only (see section 1).
- Plugin variables (`ANDROID_APPKEY`, `IOS_DEV_APPKEY`, `SERVER_URL`, `CUSTOM_ACTIONS` and so on)
  are not applied under Capacitor. Use the files above.
- The Notification Service Extension is built and embedded, but it was not seen running (see
  "Notification Service Extension (iOS)").
- The Cordova plugins use callbacks and are reached through global objects. `capacitor/acoustic-campaign.ts`
  adds Promises and types for the common calls (see "Promises and types"), but it is a file to copy,
  not an npm package. A Promise never settles if the native side fails, because the plugins only log
  errors.
