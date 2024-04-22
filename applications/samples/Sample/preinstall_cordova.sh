#!/bin/bash
set +eu

echo "Removing android platform"
cordova platform rm android 
echo ""

echo "Removing ios platform"
cordova platform rm ios
echo ""

echo "Removing all Acoustic plugins"
cordova plugin rm cordova-acoustic-mobile-push
cordova plugin rm cordova-acoustic-mobile-push-plugin-location
cordova plugin rm cordova-acoustic-mobile-push-plugin-beacon
cordova plugin rm cordova-acoustic-mobile-push-plugin-inapp
cordova plugin rm cordova-acoustic-mobile-push-plugin-inbox
cordova plugin rm cordova-acoustic-mobile-push-plugin-calendar
cordova plugin rm cordova-acoustic-mobile-push-plugin-displayweb
cordova plugin rm cordova-acoustic-mobile-push-plugin-dial
cordova plugin rm cordova-acoustic-mobile-push-plugin-snooze
cordova plugin rm cordova-acoustic-mobile-push-plugin-geofence
cordova plugin rm cordova-acoustic-mobile-push-plugin-ios-notification-service
cordova plugin rm cordova-acoustic-mobile-push-plugin-action-menu
cordova plugin rm cordova-acoustic-mobile-push-plugin-passbook

npm rm cordova-acoustic-mobile-push-beta
npm rm cordova-acoustic-mobile-push-plugin-location-beta
npm rm cordova-acoustic-mobile-push-plugin-beacon-beta
npm rm cordova-acoustic-mobile-push-plugin-inapp-beta
npm rm cordova-acoustic-mobile-push-plugin-inbox-beta
npm rm cordova-acoustic-mobile-push-plugin-calendar-beta
npm rm cordova-acoustic-mobile-push-plugin-displayweb-beta
npm rm cordova-acoustic-mobile-push-plugin-dial-beta
npm rm cordova-acoustic-mobile-push-plugin-snooze-beta
npm rm cordova-acoustic-mobile-push-plugin-geofence-beta
npm rm cordova-acoustic-mobile-push-plugin-ios-notification-service-beta
npm rm cordova-acoustic-mobile-push-plugin-action-menu-beta
npm rm cordova-acoustic-mobile-push-plugin-passbook-beta