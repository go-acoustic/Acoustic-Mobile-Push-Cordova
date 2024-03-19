#!/bin/bash
set +eu

echo "Removing android platform"
echo ""
cordova platform rm android 

echo "Removing ios platform"
cordova platform rm ios

echo "Removing all Acoustic plugins"
echo ""
cordova plugin rm cordova-acoustic-mobile-push-sdk-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-fcm-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-location-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-beacon-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-inapp-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-inbox-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-calendar-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-displayweb-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-dial-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-snooze-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-geofence-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-ios-notification-service-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-action-menu-beta
cordova plugin rm cordova-acoustic-mobile-push-plugin-passbook-beta



