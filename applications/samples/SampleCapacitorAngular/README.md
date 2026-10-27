# SampleCapacitorAngular

The Acoustic Campaign sample app for **Angular 20, Ionic 8 and Capacitor 8**. It has the same screens as
`SampleCapacitor`, built as Angular components with Ionic. The Acoustic plugins are the Cordova plugins of this
repository, used through Capacitor's Cordova compatibility layer (see `documentation/CAPACITOR.md`).

| Where | What |
|---|---|
| `src/app/acoustic/acoustic-campaign.ts` | Typed, Promise-based wrapper of the plugins. A copy of `capacitor/acoustic-campaign.ts` of the core plugin, as an app of yours would hold it; `npm run sync-wrapper` refreshes it. |
| `src/app/acoustic/acoustic.service.ts` | Angular service: waits for the plugins and runs plugin callbacks inside Angular's zone |
| `src/app/pages` | One component per screen: registration, inbox, in-app, custom actions, events, attributes, geofences |
| `angular.json` | jQuery in `scripts`, which the in-app templates of the plugin need |
| `public/css`, `public/images` | Styles and images of the in-app templates. `images/inApp` is not copied from the plugin by Capacitor, so it is kept here. |

## Run it

```bash
npm install
npx ng build
npx cap sync
```

Pass your app keys (Campaign, Android and iOS) and the server of your pod to the setup script. It fills in
`android/app/src/main/res/values/strings.xml` and `ios/App/App/MceConfig.json`, which hold the placeholders
`YOUR_ANDROID_APP_KEY` and `YOUR_IOS_APP_KEY`:

```bash
node node_modules/cordova-acoustic-mobile-push/scripts/capacitorSetup.js \
  --server-url https://mobile-sdk-lib-XX-Y.brilliantcollector.com \
  --android-app-key YOUR_ANDROID_APP_KEY \
  --ios-dev-key YOUR_IOS_DEV_APP_KEY --ios-prod-key YOUR_IOS_PROD_APP_KEY
```

- **Android**: put the `google-services.json` of your Firebase project in `android/app/`. It must list the package
  `co.acoustic.mobile.push.samples.android`, or change `applicationId` in `android/app/build.gradle`. Build with JDK 21.
- **iOS**: open `ios/App/App.xcworkspace` in Xcode and set your team. The bundle ID must match the app in Campaign
  (push needs the APNs credential of that bundle ID). The deployment target is iOS 15.1.
- Run `npx cap run android` or `npx cap run ios`. The plugins are not available in a browser (`ng serve`); the app then
  shows that and keeps the layout.

## Notes

- **Notification permission (Android 13 and later):** the Acoustic plugins only declare `POST_NOTIFICATIONS`, so the app
  has to ask for it. `AcousticService.requestNotificationPermission()` does it with `@capacitor/local-notifications`
  when the home page opens. Without the permission the push arrives but is not shown. iOS asks when the Acoustic SDK
  registers for push.
- Do not commit real app keys. The files in this sample hold placeholders.
- The default Inbox screen of the Inbox plugin is built on jQuery Mobile, so this sample draws its own inbox on top of
  `MCEInboxPlugin`. The plugin wires its default screen only when jQuery Mobile is present.
- The message page draws the message in a sandboxed iframe and forwards taps on its action links to
  `executeInboxAction`, as the default screen does with jQuery. Without it the links do nothing and no click event is
  reported. The frame is sandboxed with `allow-scripts` (iOS does not deliver the taps to the page otherwise) and the
  message starts with a content security policy that blocks its scripts.
- The geofences screen lists the geofences around the device. The other samples also draw them on a Google map, which
  needs a Google Maps API key.
- The in-app templates are drawn by the plugin with jQuery on top of the Ionic pages. They need `jquery` in `scripts` and
  the `inapp_*.css` files linked in `src/index.html`.
