#!/bin/bash
set +eu

echo "Removing android platform"
echo ""
cordova platform rm android 

echo "Removing ios platform"
cordova platform rm ios

echo "Removing all Acoustic plugins"
echo ""
cordova plugin rm co.acoustic.mobile.push.sdk
cordova plugin rm co.acoustic.mobile.push.plugin.fcm
cordova plugin rm co.acoustic.mobile.push.plugin.location
cordova plugin rm co.acoustic.mobile.push.plugin.beacon
cordova plugin rm co.acoustic.mobile.push.plugin.inapp
cordova plugin rm co.acoustic.mobile.push.plugin.inbox
cordova plugin rm co.acoustic.mobile.push.plugin.calendar
cordova plugin rm co.acoustic.mobile.push.plugin.displayweb
cordova plugin rm co.acoustic.mobile.push.plugin.dial
cordova plugin rm co.acoustic.mobile.push.plugin.snooze
cordova plugin rm co.acoustic.mobile.push.plugin.geofence
cordova plugin rm co.acoustic.mobile.push.plugin.ios-notification-service
cordova plugin rm co.acoustic.mobile.push.plugin.action-menu
cordova plugin rm co.acoustic.mobile.push.plugin.passbook



