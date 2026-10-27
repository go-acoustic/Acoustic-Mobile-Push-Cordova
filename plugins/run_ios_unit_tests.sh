#!/bin/bash
# Runs the XCTest unit tests of the iOS glue (cordova-acoustic-mobile-push/src/ios/test) inside a Cordova project
# that has the iOS platform and the plugins added and has been built once (so CocoaPods ran).
#
#   ./run_ios_unit_tests.sh <cordova-project-dir> [simulator name, default "iPhone 17 Pro"]
#
# The repository has no Xcode project of its own, so the script borrows the one of the Cordova project:
#  - copies the plugin sources over the copies that "cordova plugin add" made, so the tests see the current code,
#  - adds a hosted unit test bundle target "AcousticUnitTests" (host: the app) and a shared scheme of the same name
#    to platforms/ios/App.xcodeproj, once,
#  - runs the tests on the simulator without code signing.
# The tests use the real callback database of the SDK, inside the app. Use a throw-away project: the script
# changes platforms/ios.

set -e
project="$1"
simulator="${2:-iPhone 17 Pro}"
plugin="$(cd "$(dirname "$0")" && pwd)/cordova-acoustic-mobile-push"

if [ -z "$project" ] || [ ! -d "$project/platforms/ios/App.xcworkspace" ]; then
  echo "usage: $0 <cordova-project-dir with platforms/ios built once> [simulator name]" >&2
  exit 2
fi
ios="$project/platforms/ios"

# the plugin sources of the app (the plugin folder of the app also holds the generated files, so copy file by file)
for file in "$plugin"/src/ios/*.m "$plugin"/src/ios/*.h; do
  cp "$file" "$ios/App/Plugins/cordova-acoustic-mobile-push/"
done
mkdir -p "$ios/AcousticUnitTests"
cp "$plugin"/src/ios/test/*.m "$ios/AcousticUnitTests/"

# the product of the app is named after the app (CordovaClean163.app), not after the target
settings="$(cd "$ios" && xcodebuild -workspace App.xcworkspace -scheme App -showBuildSettings -destination "platform=iOS Simulator,name=$simulator" 2>/dev/null)"
product="$(echo "$settings" | awk -F' = ' '/^ *FULL_PRODUCT_NAME = /{print $2; exit}')"
executable="$(echo "$settings" | awk -F' = ' '/^ *EXECUTABLE_NAME = /{print $2; exit}')"
if [ -z "$product" ] || [ -z "$executable" ]; then
  echo "could not read the product name of the app from xcodebuild -showBuildSettings" >&2
  exit 2
fi

ruby - "$ios/App.xcodeproj" "$product" "$executable" <<'RUBY'
require 'xcodeproj'
path = ARGV[0]
product = ARGV[1]
executable = ARGV[2]
name = 'AcousticUnitTests'
project = Xcodeproj::Project.open(path)
app = project.targets.find { |t| t.name == 'App' } or abort('target App not found')
target = project.targets.find { |t| t.name == name }
unless target
  deployment = app.build_configurations.first.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] || '15.1'
  target = project.new_target(:unit_test_bundle, name, :ios, deployment)
  target.add_dependency(app)
  group = project.main_group.new_group(name, name)
  target.add_file_references(Dir.glob(File.join(File.dirname(path), name, '*.m')).sort.map { |f| group.new_file(File.basename(f)) })
end
target.build_configurations.each do |config|
  app_config = app.build_configurations.find { |c| c.name == config.name }
  # the Pods settings of the app give the framework and header search paths of the Acoustic SDK
  config.base_configuration_reference = app_config.base_configuration_reference
  config.build_settings['TEST_HOST'] = "$(BUILT_PRODUCTS_DIR)/#{product}/#{executable}"
  config.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
  config.build_settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'co.acoustic.AcousticUnitTests'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
end
project.save
scheme_dir = Xcodeproj::XCScheme.shared_data_dir(path)
scheme_file = File.join(scheme_dir, "#{name}.xcscheme")
unless File.exist?(scheme_file)
  scheme = Xcodeproj::XCScheme.new
  scheme.add_build_target(app)
  scheme.add_build_target(target, false)
  scheme.add_test_target(target)
  scheme.save_as(path, name, true)
end
RUBY

cd "$ios"
xcodebuild test -workspace App.xcworkspace -scheme AcousticUnitTests \
  -destination "platform=iOS Simulator,name=$simulator" CODE_SIGNING_ALLOWED=NO
