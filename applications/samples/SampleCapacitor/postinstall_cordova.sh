echo "Building plugins"
cd ../../../plugins
sh build.sh > /dev/null
cd ../applications/samples/SampleCapacitor

echo "Building tests"
cd ../../../plugins
sh build_tests.sh > /dev/null
cd ../applications/samples/SampleCapacitor

echo "Update project"
echo ""
npx cap sync

# echo "Adding Core Acoustic SDK plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-sdk --variable CUSTOM_ACTIONS="openInboxMessage sendEmail" --variable ANDROID_APPKEY="gcnslVYNku" --variable IOS_DEV_APPKEY="apB9YG5Umw" --variable IOS_PROD_APPKEY="apB9YG5Umw" --variable SERVER_URL=https://mobile-sdk-lib-us-0.brilliantcollector.com --variable LOGLEVEL=verbose --variable MCE_CAN_SYNC_OVERRIDE=true --force

# echo "Adding FCM plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-fcm

# echo "Adding Location plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-location --variable SYNC_RADIUS=10000 --variable SYNC_INTERVAL=60

# echo "Adding Beacon plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-beacon --variable UUID=21A9A7F4-0DD8-46B7-9D4D-379F3C4AF77D

# echo "Adding Inapp plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-inapp 

# echo "Adding Inbox plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-inbox

# echo "Adding display web, dial & snooze plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-displayweb
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-dial
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-snooze

# echo "Adding Calendar plugin"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-calendar

# echo "Adding display geofence"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-geofence

# echo "Adding iOS notification service"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-ios-notification-service

# echo "Adding iOS Action Menu"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-action-menu

# echo "Adding iOS Passbook"
# echo ""
# cordova plugin add file:../../../plugins/cordova-acoustic-mobile-push-plugin-passbook

# # Tests
# echo "Adding tests"
# echo ""
# cordova plugin add ../../../plugins/cordova-acoustic-mobile-push-sdk/tests
