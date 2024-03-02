#!/bin/bash
if [ $2 != "ios" ]; then
  emulator -avd $1 &
  device=$(adb devices | tail -n +1 | cut -sf 1)
  len=${#device}
  while [ $len -eq 0 ]
  do
    # Wait a bit, then see if the device is online
    sleep 5
    device=$(adb devices | tail -n +1 | cut -sf 1)
    len=${#device}
  done
else
  device=$1
fi

cordova-paramedic  --platform "$2" \
  --plugin './cordova-acoustic-mobile-push-sdk --variable CUSTOM_ACTIONS="openInboxMessage sendEmail" --variable ANDROID_APPKEY="gcnslVYNku" --variable IOS_DEV_APPKEY="ap2zqZUqe1" --variable IOS_PROD_APPKEY="ap2zqZUqe1" --variable SERVER_URL=https://mobile-sdk-lib-us-0.brilliantcollector.com --variable LOGLEVEL=verbose --variable MCE_CAN_SYNC_OVERRIDE=true' \
  --plugin './cordova-acoustic-mobile-push-plugin-fcm' \
  --target "$device" \
  --appName "co.acoustic.mobile.push.samples.android"

exit=$?

# Kill all running android emulators
adb devices | grep emulator | cut -f1 | while read line; do adb -s $line emu kill & sleep 20; done

# Kill all running ios simulators
xcrun simctl shutdown all
exit $exit
