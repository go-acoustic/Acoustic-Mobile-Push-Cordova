echo "Building plugins"
cd ../../../plugins
sh build.sh > /dev/null
cd ../applications/samples/Sample

echo "Building tests"
cd ../../../plugins
sh build_tests.sh > /dev/null
cd ../applications/samples/Sample

echo "Adding android platform"
echo ""
cordova platform add android

echo "Adding ios platform"
echo ""
cordova platform add ios

echo "Adding Core Acoustic SDK plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-sdk-beta --variable CUSTOM_ACTIONS="openInboxMessage sendEmail" --variable ANDROID_APPKEY="YOUR ANDROID APPKEY HERE" --variable IOS_DEV_APPKEY="YOUR iOS APPKEY HERE" --variable IOS_PROD_APPKEY="YOUR iOS APPKEY HERE" --variable SERVER_URL=https://mobile-sdk-lib-xx-y.brilliantcollector.com --variable LOGLEVEL=error --variable MCE_CAN_SYNC_OVERRIDE=true --force

echo "Adding FCM plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-fcm-beta

echo "Adding Location plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-location-beta --variable SYNC_RADIUS=10000 --variable SYNC_INTERVAL=60

echo "Adding Beacon plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-beacon-beta --variable UUID=21A9A7F4-0DD8-46B7-9D4D-379F3C4AF77D

echo "Adding Inapp plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-inapp-beta 

echo "Adding Inbox plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-inbox-beta

echo "Adding display web, dial & snooze plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-displayweb-beta
cordova plugin add cordova-acoustic-mobile-push-plugin-dial-beta
cordova plugin add cordova-acoustic-mobile-push-plugin-snooze-beta

echo "Adding Calendar plugin"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-calendar-beta

echo "Adding display geofence"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-geofence-beta

echo "Adding iOS notification service"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-ios-notification-service-beta

echo "Adding iOS Action Menu"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-action-menu-beta

echo "Adding iOS Passbook"
echo ""
cordova plugin add cordova-acoustic-mobile-push-plugin-passbook-beta


