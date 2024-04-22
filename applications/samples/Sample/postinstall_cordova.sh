echo "Adding android platform"
cordova platform add android
echo ""

echo "Adding ios platform"
cordova platform add ios
echo ""

echo "Adding Core Acoustic SDK plugin"
npm install cordova-acoustic-mobile-push-beta
echo ""

# echo "Running install for all plugins"
# node node_modules/cordova-acoustic-mobile-push-beta/scripts/installPlugins.js
# echo ""