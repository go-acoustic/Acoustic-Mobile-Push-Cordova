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
cordova plugin rm cordova-acoustic-mobile-push-plugin-snooze
cordova plugin rm cordova-acoustic-mobile-push-plugin-geofence
cordova plugin rm cordova-acoustic-mobile-push-plugin-ios-notification-service
cordova plugin rm cordova-acoustic-mobile-push-plugin-action-menu
cordova plugin rm cordova-acoustic-mobile-push-plugin-passbook

npm rm cordova-acoustic-mobile-push
npm rm cordova-acoustic-mobile-push-plugin-location
npm rm cordova-acoustic-mobile-push-plugin-beacon
npm rm cordova-acoustic-mobile-push-plugin-inapp
npm rm cordova-acoustic-mobile-push-plugin-inbox
npm rm cordova-acoustic-mobile-push-plugin-calendar
npm rm cordova-acoustic-mobile-push-plugin-displayweb
npm rm cordova-acoustic-mobile-push-plugin-snooze
npm rm cordova-acoustic-mobile-push-plugin-geofence
npm rm cordova-acoustic-mobile-push-plugin-ios-notification-service
npm rm cordova-acoustic-mobile-push-plugin-action-menu
npm rm cordova-acoustic-mobile-push-plugin-passbook