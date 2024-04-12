echo "Adding android platform"
cordova platform add android
echo ""

echo "Adding ios platform"
cordova platform add ios
echo ""

echo "Adding Core Acoustic SDK plugin"
npm install cordova-acoustic-mobile-push-sdk-beta
echo ""

# echo "Running install for all plugins"
# node node_modules/cordova-acoustic-mobile-push-sdk-beta/scripts/installPlugins.js
# echo ""