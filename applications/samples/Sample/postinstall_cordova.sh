# Setup settings to run application
# Used in cordova-acoustic-mobile-push-sdk
customAction="openInboxMessage sendEmail"
androidAppkey="YOUR ANDROID APPKEY HERE"
iOSAppkey="YOUR iOS APPKEY HERE"
iOSProdkey="YOUR iOS APPKEY HERE"
serverUrl="https://mobile-sdk-lib-xx-y.brilliantcollector.com"
logLevel="verbose"
mceCanSyncOverride=true

# Used in cordova-acoustic-mobile-push-plugin-location
syncRadius=10000 
syncInterval=60

# Used in cordova-acoustic-mobile-push-plugin-beacon
uuid=21A9A7F4-0DD8-46B7-9D4D-379F3C4AF77D

echo "Adding android platform"
cordova platform add android
echo ""

echo "Adding ios platform"
cordova platform add ios
echo ""

echo "Adding Core Acoustic SDK plugin"
cordova plugin add cordova-acoustic-mobile-push-sdk-beta --variable CUSTOM_ACTIONS="$customAction" --variable ANDROID_APPKEY="$androidAppkey" --variable IOS_DEV_APPKEY="$iOSAppkey" --variable IOS_PROD_APPKEY="$iOSProdkey" --variable SERVER_URL="$serverUrl" --variable LOGLEVEL=error"$logLevel" --variable MCE_CAN_SYNC_OVERRIDE="$mceCanSyncOverride" --force
echo ""

echo "Adding FCM plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-fcm-beta
echo ""

echo "Adding Location plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-location-beta --variable SYNC_RADIUS="$syncRadius" --variable SYNC_INTERVAL="$syncInterval"
echo ""

echo "Adding Beacon plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-beacon-beta --variable UUID="$uuid"
echo ""

echo "Adding Inapp plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-inapp-beta 
echo ""

echo "Adding Inbox plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-inbox-beta
echo ""

echo "Adding display web plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-displayweb-beta
echo ""

echo "Adding display dial plugin"
cordova plugin add cordova-acoustic-mobile-push-plugin-dial-beta
echo ""

echo "Adding display snooze plugin"
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
