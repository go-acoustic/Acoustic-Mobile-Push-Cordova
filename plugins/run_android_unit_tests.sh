#!/bin/bash
# Runs the Robolectric unit tests of the Android glue (cordova-acoustic-mobile-push/src/android/test) inside a
# Cordova project that has the Android platform and the plugins added (for example a build of the Sample app).
#
#   ./run_android_unit_tests.sh <cordova-project-dir> [gradle test filter, for example '*MessageReceivedQueueTest*']
#
# The repository has no Gradle project of its own, so the script borrows the one of the Cordova project:
#  - copies the tests into platforms/android/app/src/test/java,
#  - copies the plugin sources over the copies that "cordova plugin add" made, so the tests see the current code,
#  - adds the test dependencies to platforms/android/app/build.gradle once (marker: ACOUSTIC_UNIT_TEST_DEPENDENCIES).
# Use a throw-away project: the script changes files under platforms/android.
# MceSdk starts a static initializer that needs com.android.installreferrer (an optional dependency of the SDK), so the
# test classpath has it; without it every test that mocks MceSdk fails with "class redefinition failed" or
# "could not be initialized". Run with JDK 17 or 21 (JAVA_HOME).

set -e
project="$1"
filter="$2"
plugin="$(cd "$(dirname "$0")" && pwd)/cordova-acoustic-mobile-push"

if [ -z "$project" ] || [ ! -d "$project/platforms/android/app" ]; then
  echo "usage: $0 <cordova-project-dir with platforms/android> [test filter]" >&2
  exit 2
fi
android="$project/platforms/android"
sources="$android/app/src/main/java"

mkdir -p "$android/app/src/test/java"
cp -R "$plugin/src/android/test/java/." "$android/app/src/test/java/"
cp -R "$plugin/src/android/src/." "$sources/"

if ! grep -q ACOUSTIC_UNIT_TEST_DEPENDENCIES "$android/app/build.gradle"; then
  cat >> "$android/app/build.gradle" <<'GRADLE'

// ACOUSTIC_UNIT_TEST_DEPENDENCIES
android {
    testOptions {
        unitTests.includeAndroidResources = true
    }
}

dependencies {
    testImplementation 'junit:junit:4.13.2'
    testImplementation 'org.robolectric:robolectric:4.13'
    testImplementation 'androidx.test:core:1.6.1'
    testImplementation 'org.mockito:mockito-core:5.12.0'
    testImplementation 'com.android.installreferrer:installreferrer:2.2'
}
GRADLE
fi

cd "$android"
if [ -n "$filter" ]; then
  ./gradlew :app:testDebugUnitTest --tests "$filter"
else
  ./gradlew :app:testDebugUnitTest
fi
