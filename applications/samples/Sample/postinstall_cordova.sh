echo "Adding android platform"
cordova platform add android
echo ""

echo "Adding ios platform"
cordova platform add ios
echo ""

echo "Adding Core Acoustic SDK plugin"
# # cordova plugin add cordova-acoustic-mobile-push-sdk-beta --variable CUSTOM_ACTIONS="openInboxMessage sendEmail" --variable ANDROID_APPKEY="YOUR ANDROID APPKEY HERE" --variable IOS_DEV_APPKEY="YOUR iOS APPKEY HERE" --variable IOS_PROD_APPKEY="YOUR iOS APPKEY HERE" --variable SERVER_URL=https://mobile-sdk-lib-xx-y.brilliantcollector.com --variable LOGLEVEL=error --variable MCE_CAN_SYNC_OVERRIDE=true --force
cordova plugin add cordova-acoustic-mobile-push-sdk-beta --variable CUSTOM_ACTIONS="openInboxMessage sendEmail" --variable ANDROID_APPKEY="YOUR ANDROID APPKEY HERE" --variable IOS_DEV_APPKEY="YOUR iOS APPKEY HERE" --variable IOS_PROD_APPKEY="YOUR iOS APPKEY HERE" --variable SERVER_URL=https://mobile-sdk-lib-xx-y.brilliantcollector.com --variable LOGLEVEL=error --variable MCE_CAN_SYNC_OVERRIDE=true --force
echo ""

echo "Adding FCM plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-fcm-beta
echo ""

echo "Adding Location plugin"
# # # cordova plugin add cordova-acoustic-mobile-push-plugin-location-beta --variable SYNC_RADIUS=10000 --variable SYNC_INTERVAL=60
cordova plugin add cordova-acoustic-mobile-push-plugin-location-beta --variable SYNC_RADIUS=10000 --variable SYNC_INTERVAL=60
echo ""

echo "Adding Beacon plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-beacon-beta --variable UUID=21A9A7F4-0DD8-46B7-9D4D-379F3C4AF77D
echo ""

echo "Adding Inapp plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-inapp-beta 
echo ""

echo "Adding Inbox plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-inbox-beta
echo ""

echo "Adding display web, dial & snooze plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-displayweb-beta
cordova plugin add cordova-acoustic-mobile-push-plugin-dial-beta
cordova plugin add cordova-acoustic-mobile-push-plugin-snooze-beta
echo ""

echo "Adding Calendar plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-calendar-beta
echo ""

echo "Adding display geofence"
cordova plugin add cordova-acoustic-mobile-push-plugin-geofence-beta
echo ""

echo "Adding iOS notification service"
cordova plugin add cordova-acoustic-mobile-push-plugin-ios-notification-service-beta
echo ""

echo "Adding iOS Action Menu"
cordova plugin add cordova-acoustic-mobile-push-plugin-action-menu-beta
echo ""

echo "Adding iOS Passbook"
cordova plugin add cordova-acoustic-mobile-push-plugin-passbook-beta
echo ""

