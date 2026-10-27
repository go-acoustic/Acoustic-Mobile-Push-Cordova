/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

// Applies the native project changes that the Cordova hooks make for a Cordova app, to a
// Capacitor app (Capacitor runs no Cordova hooks and passes no --variable values).
// See documentation/CAPACITOR.md in the Acoustic-Mobile-Push-Cordova repository. Safe to run more than once.
//
// Usage (from the Capacitor project root):
//   node node_modules/cordova-acoustic-mobile-push-beta/scripts/capacitorSetup.js \
//     --server-url https://mobile-sdk-lib-XX-Y.brilliantcollector.com \
//     --android-app-key KEY --ios-dev-key KEY --ios-prod-key KEY [--dry-run]

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// The native SDK versions come from CampaignConfig.json (see nativeSdkVersions below);
// the values here are used only when no CampaignConfig.json can be read.
const DEFAULT_NATIVE_SDK = { android: '3.11.3', ios: '3.10.12' };

// Keep in sync with the version block in installPlugins.js
const ANDROID_VERSIONS = {
	mobilePushVersion: DEFAULT_NATIVE_SDK.android,
	androidxLibVersion: '1.6.0',
	playServicesBaseVersion: '18.3.0',
	playServicesLocationVersion: '21.0.1',
	firebaseCoreVersion: '19.0.2',
	firebaseMessagingVersion: '22.0.0',
	securityCryptoVersion: '1.1.0'
};

const PROGUARD_RULES = [
	'-keep class co.acoustic.mobile.push.** { *; }',
	'-dontwarn com.google.android.gms.location.**',
	'-dontwarn com.android.installreferrer.**',
	'-dontwarn org.sqlite.**'
];

const MARK_EXT = '// acoustic-mobile-push: version properties';
const MARK_VERIFY = '// acoustic-mobile-push: release resource check';

const LOCATION_USAGE = 'Be notified when interesting things are nearby';

const FLAGS = {
	'--beacon-uuid': 'beaconUuid', 
	'--project': 'project', '--server-url': 'serverUrl', '--android-app-key': 'androidAppKey',
	'--ios-dev-key': 'iosDevKey', '--ios-prod-key': 'iosProdKey', '--log-level': 'logLevel'
};

// Native SDK versions: androidVersion and iOSVersion of the CampaignConfig.json in the project
// (the one the plugin copies there), else of the one shipped with the plugin, else DEFAULT_NATIVE_SDK.
// An empty value in the file means "latest": Android "+", iOS no version in the Podfile.
function nativeSdkVersions(opts) {
	const candidates = [path.join(opts.project, 'CampaignConfig.json'), path.join(__dirname, '..', 'CampaignConfig.json')];
	for (const file of candidates) {
		try {
			const config = JSON.parse(fs.readFileSync(file, 'utf8'));
			return { android: config.androidVersion || '+', ios: config.iOSVersion || '' };
		} catch (e) {
			// not there or not valid JSON: try the next one
		}
	}
	return { ...DEFAULT_NATIVE_SDK };
}

function parseArgs(argv) {
	const opts = { project: process.cwd(), logLevel: 'error', dryRun: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--dry-run') {
			opts.dryRun = true;
		} else if (arg === '--help' || arg === '-h') {
			opts.help = true;
		} else if (FLAGS[arg] && i + 1 < argv.length) {
			opts[FLAGS[arg]] = argv[++i];
		} else {
			throw new Error(`Unknown or incomplete option: ${arg}`);
		}
	}
	return opts;
}

const report = [];
function log(area, message) {
	report.push(`${area.padEnd(8)} ${message}`);
}

function writeIfChanged(opts, file, content, area, what) {
	const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
	if (old === content) {
		log(area, `ok       ${what}`);
		return;
	}
	if (!opts.dryRun) {
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, content);
	}
	log(area, `${old === null ? 'created ' : 'updated '} ${what}`);
}

function readOr(file, fallback) {
	return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : fallback;
}

// Names of the installed Acoustic plugins, such as "location" or "calendar"
function installedPlugins(opts) {
	const pkg = JSON.parse(readOr(path.join(opts.project, 'package.json'), '{}'));
	const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
	return Object.keys(deps)
		.map(name => name.match(/^cordova-acoustic-mobile-push-plugin-(.+?)(-beta)?$/))
		.filter(Boolean)
		.map(m => m[1]);
}

function setupAndroid(opts) {
	const root = path.join(opts.project, 'android');
	if (!fs.existsSync(root)) {
		log('android', 'skipped  android/ not found (run "npx cap add android")');
		return;
	}

	// 1. Gradle version properties and release resource check
	const gradleFile = path.join(root, 'build.gradle');
	let gradle = readOr(gradleFile, '');
	if (!gradle.includes(MARK_EXT) && !/mobilePushVersion\s*=/.test(gradle)) {
		const versions = { ...ANDROID_VERSIONS, mobilePushVersion: nativeSdkVersions(opts).android };
		const props = Object.keys(versions).map(k => `        ${k} = "${versions[k]}"`).join('\n');
		gradle += `\n${MARK_EXT}\nallprojects {\n    project.ext {\n${props}\n    }\n}\n`;
	}
	if (!gradle.includes(MARK_VERIFY)) {
		gradle += `\n${MARK_VERIFY}\nsubprojects {\n    afterEvaluate {\n` +
			`        tasks.matching { it.name == 'verifyReleaseResources' }.configureEach { enabled = false }\n    }\n}\n`;
	}
	writeIfChanged(opts, gradleFile, gradle, 'android', 'android/build.gradle (version properties, release resource check)');

	// 2. App key and sender id
	if (opts.androidAppKey) {
		const stringsFile = path.join(root, 'app/src/main/res/values/strings.xml');
		let strings = readOr(stringsFile, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n');
		strings = strings.replace(/\s*<string name="(appkey|senderid)">[^<]*<\/string>/g, '');
		strings = strings.replace('</resources>',
			`    <string name="appkey">${opts.androidAppKey}</string>\n    <string name="senderid"></string>\n</resources>`);
		writeIfChanged(opts, stringsFile, strings, 'android', 'strings.xml (appkey, senderid)');
	} else {
		log('android', 'skipped  strings.xml: --android-app-key not given');
	}

	// 3. Manifest
	const manifestFile = path.join(root, 'app/src/main/AndroidManifest.xml');
	if (fs.existsSync(manifestFile)) {
		let manifest = fs.readFileSync(manifestFile, 'utf8');
		if (!manifest.includes('xmlns:tools=')) {
			manifest = manifest.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ');
		}
		if (!manifest.includes('MceJsonApplication')) {
			manifest = manifest.replace(/<application\b/,
				'<application\n        android:name="co.acoustic.mobile.push.sdk.js.MceJsonApplication"\n        tools:replace="android:name"');
		}
		const metas = [];
		if (opts.serverUrl && !/android:name="mceServer"/.test(manifest)) {
			metas.push(`        <meta-data android:name="mceServer" android:value="${opts.serverUrl}" tools:replace="android:value" />`);
		}
		if (!/android:name="loglevel"/.test(manifest)) {
			metas.push(`        <meta-data android:name="loglevel" android:value="${opts.logLevel}" tools:replace="android:value" />`);
		}
		if (metas.length) {
			manifest = manifest.replace(/[ \t]*<\/application>/, `${metas.join('\n')}\n    </application>`);
		}
		writeIfChanged(opts, manifestFile, manifest, 'android', 'AndroidManifest.xml (application class, server, log level)');
		if (!opts.serverUrl) {
			log('android', 'warning  --server-url not given: mceServer meta-data not set');
		}
	}

	// 4. R8 rules
	const proguardFile = path.join(root, 'app/proguard-rules.pro');
	let proguard = readOr(proguardFile, '');
	const missing = PROGUARD_RULES.filter(r => !proguard.includes(r));
	if (missing.length) {
		proguard += `${proguard && !proguard.endsWith('\n') ? '\n' : ''}\n# Acoustic Mobile Push\n${missing.join('\n')}\n`;
	}
	writeIfChanged(opts, proguardFile, proguard, 'android', 'proguard-rules.pro (R8 rules)');

	// 5. Firebase config check
	const buildGradle = readOr(path.join(root, 'app/build.gradle'), '');
	const idMatch = buildGradle.match(/applicationId\s*=?\s*["']([^"']+)["']/);
	const gsFile = path.join(root, 'app/google-services.json');
	if (!fs.existsSync(gsFile)) {
		log('android', `warning  android/app/google-services.json missing${idMatch ? ` (needs package ${idMatch[1]})` : ''}; no push token without it`);
	} else if (idMatch && !fs.readFileSync(gsFile, 'utf8').includes(`"package_name": "${idMatch[1]}"`)) {
		log('android', `warning  google-services.json has no client for applicationId ${idMatch[1]}`);
	}
}

function setupCapacitorConfig(opts) {
	const candidates = ['capacitor.config.ts', 'capacitor.config.js', 'capacitor.config.json'];
	const file = candidates.map(f => path.join(opts.project, f)).find(f => fs.existsSync(f));
	if (!file) {
		log('ios', 'warning  capacitor.config not found: set ios.handleApplicationNotifications to false by hand');
		return;
	}
	const text = fs.readFileSync(file, 'utf8');
	if (/handleApplicationNotifications\s*["']?\s*:\s*false/.test(text)) {
		log('ios', `ok       ${path.basename(file)} (handleApplicationNotifications false)`);
		return;
	}
	if (/\bios\s*["']?\s*:/.test(text)) {
		log('ios', `warning  ${path.basename(file)} already has an "ios" section: add handleApplicationNotifications: false by hand`);
		return;
	}
	let updated;
	if (file.endsWith('.json')) {
		updated = text.replace(/\{\s*/, '{\n  "ios": { "handleApplicationNotifications": false },\n  ');
	} else {
		updated = text.replace(/(CapacitorConfig\s*=\s*\{|module\.exports\s*=\s*\{)/, '$1\n  ios: { handleApplicationNotifications: false },');
	}
	if (updated === text) {
		log('ios', `warning  could not edit ${path.basename(file)}: add ios: { handleApplicationNotifications: false } by hand`);
		return;
	}
	writeIfChanged(opts, file, updated, 'ios', `${path.basename(file)} (handleApplicationNotifications false)`);
}

function plistBuddy(file, command) {
	return spawnSync('/usr/libexec/PlistBuddy', ['-c', command, file], { encoding: 'utf8' });
}

// Adds missing background modes and usage description strings to Info.plist (existing values are kept)
function updatePlist(opts, file, modes, strings) {
	if (!fs.existsSync(file)) {
		return;
	}
	const added = [];
	const hasModes = plistBuddy(file, 'Print :UIBackgroundModes').status === 0;
	if (!hasModes && !opts.dryRun) {
		plistBuddy(file, 'Add :UIBackgroundModes array');
	}
	const present = hasModes ? plistBuddy(file, 'Print :UIBackgroundModes').stdout : '';
	modes.filter(m => !new RegExp(`\\b${m}\\b`).test(present)).forEach(m => {
		if (!opts.dryRun) {
			plistBuddy(file, `Add :UIBackgroundModes: string ${m}`);
		}
		added.push(m);
	});
	Object.keys(strings).forEach(key => {
		if (plistBuddy(file, `Print :${key}`).status !== 0) {
			if (!opts.dryRun) {
				plistBuddy(file, `Add :${key} string ${strings[key]}`);
			}
			added.push(key);
		}
	});
	log('ios', added.length ? `updated  Info.plist (${added.join(', ')})` : 'ok       Info.plist');
}

const NSE_FILES = {
	'NotificationService.h':
		'#import <UserNotifications/UserNotifications.h>\n#import <AcousticMobilePushNotification/AcousticMobilePushNotification.h>\n\n' +
		'// Handles media attachments and dynamic action categories in Acoustic push messages\n' +
		'@interface NotificationService : MCENotificationService\n@end\n',
	'NotificationService.m':
		'#import "NotificationService.h"\n\n@implementation NotificationService\n@end\n',
	'Info.plist':
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
		'<plist version="1.0">\n<dict>\n' +
		'\t<key>CFBundleDevelopmentRegion</key>\n\t<string>en</string>\n' +
		'\t<key>CFBundleDisplayName</key>\n\t<string>NotificationService</string>\n' +
		'\t<key>CFBundleExecutable</key>\n\t<string>$(EXECUTABLE_NAME)</string>\n' +
		'\t<key>CFBundleIdentifier</key>\n\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>\n' +
		'\t<key>CFBundleInfoDictionaryVersion</key>\n\t<string>6.0</string>\n' +
		'\t<key>CFBundleName</key>\n\t<string>$(PRODUCT_NAME)</string>\n' +
		'\t<key>CFBundlePackageType</key>\n\t<string>XPC!</string>\n' +
		'\t<key>CFBundleShortVersionString</key>\n\t<string>$(MARKETING_VERSION)</string>\n' +
		'\t<key>CFBundleVersion</key>\n\t<string>$(CURRENT_PROJECT_VERSION)</string>\n' +
		'\t<key>NSExtension</key>\n\t<dict>\n' +
		'\t\t<key>NSExtensionPointIdentifier</key>\n\t\t<string>com.apple.usernotifications.service</string>\n' +
		'\t\t<key>NSExtensionPrincipalClass</key>\n\t\t<string>NotificationService</string>\n' +
		'\t</dict>\n</dict>\n</plist>\n'
};

function entitlementsXml(appGroup, keychainGroup, extra) {
	return '<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
		'<plist version="1.0">\n<dict>\n' + (extra || '') +
		`\t<key>com.apple.security.application-groups</key>\n\t<array>\n\t\t<string>${appGroup}</string>\n\t</array>\n` +
		`\t<key>keychain-access-groups</key>\n\t<array>\n\t\t<string>${keychainGroup}</string>\n\t</array>\n` +
		'</dict>\n</plist>\n';
}

function appBundleId(projectFile) {
	const text = readOr(path.join(projectFile, 'project.pbxproj'), '');
	const m = text.match(/PRODUCT_BUNDLE_IDENTIFIER = "?([A-Za-z0-9.\-]+)"?;/);
	return m ? m[1] : null;
}

// Notification Service Extension: files, shared groups, Podfile. The Xcode target is made by the ruby helper.
function setupNotificationService(opts, appDir, target, projectFile) {
	const bundleId = appBundleId(projectFile);
	if (!bundleId) {
		log('ios', 'warning  NotificationService: could not read the app bundle id');
		return false;
	}
	const appGroup = `group.${bundleId}`;
	const keychainGroup = `$(AppIdentifierPrefix)${bundleId}`;
	const dir = path.join(target, '..', 'NotificationService');

	Object.keys(NSE_FILES).forEach(name => {
		const file = path.join(dir, name);
		if (!fs.existsSync(file)) {
			writeIfChanged(opts, file, NSE_FILES[name], 'ios', `NotificationService/${name}`);
		}
	});
	const nseEntitlements = path.join(dir, 'NotificationService.entitlements');
	if (!fs.existsSync(nseEntitlements)) {
		writeIfChanged(opts, nseEntitlements, entitlementsXml(appGroup, keychainGroup), 'ios',
			`NotificationService/NotificationService.entitlements (app group ${appGroup})`);
	}

	// The app must share the same app group and keychain group with the extension
	const appEntitlements = path.join(target, 'App.entitlements');
	if (fs.existsSync(appEntitlements)) {
		const xml = fs.readFileSync(appEntitlements, 'utf8');
		if (!xml.includes('com.apple.security.application-groups')) {
			const extra = (xml.match(/\t<key>aps-environment<\/key>\n\t<string>[^<]*<\/string>\n/) || [''])[0];
			writeIfChanged(opts, appEntitlements, entitlementsXml(appGroup, keychainGroup, extra), 'ios',
				'App/App.entitlements (app group and keychain group shared with the extension)');
		} else {
			log('ios', 'ok       App/App.entitlements (groups present: check they match the extension)');
		}
	}

	// Pods for the extension target
	const podfile = path.join(appDir, 'Podfile');
	const podText = readOr(podfile, '');
	if (podText && !/target 'NotificationService'/.test(podText)) {
		const iosVersion = nativeSdkVersions(opts).ios;
		const podVersion = iosVersion ? `, '${iosVersion}'` : '';
		const block = `\ntarget 'NotificationService' do\n  pod 'AcousticMobilePushNotificationDebug'${podVersion}\n  pod 'AcousticMobilePushDebug'${podVersion}\nend\n`;
		const updated = podText.includes('post_install') ? podText.replace(/\npost_install/, `${block}\npost_install`) : podText + block;
		writeIfChanged(opts, podfile, updated, 'ios', 'Podfile (NotificationService pods; use the non-Debug pods for release)');
	} else if (podText) {
		log('ios', 'ok       Podfile (NotificationService)');
	}
	return true;
}

// CocoaPods sources. CocoaPods trunk becomes read-only on 2 December 2026 and receives no later
// versions of the Acoustic pods; they are published to the Acoustic spec repo instead. A pod
// cannot name its source, so the app's Podfile lists the repo, ahead of the CocoaPods CDN.
// Declaring any source disables the implicit CDN default, so the CDN is added when the Podfile
// declares none. CocoaPods merges versions across sources, so versions that exist only on trunk
// still resolve. `npx cap sync` rewrites only the capacitor_pods block, so the lines stay.
const PODSPECS_SOURCE = "source 'https://github.com/go-acoustic/PodSpecs.git'";
const CDN_SOURCE = "source 'https://cdn.cocoapods.org/'";

// Only active lines count: a commented-out source names nothing. Either quote style, with or without .git.
const PODSPECS_LINE = /^[ \t]*source[ \t]+(['"])https:\/\/github\.com\/go-acoustic\/PodSpecs(?:\.git)?\1/m;
const FIRST_SOURCE = /^[ \t]*source[ \t]+['"]/m;
const REQUIRE_LINE = /^require_relative .*(?:\n|$)/m;

// Inserts by position, not by replacing text, so a commented-out copy of the line is never the one edited.
function insertAt(text, index, insertion) {
	return text.slice(0, index) + insertion + text.slice(index);
}

function podfileWithSources(podText) {
	if (PODSPECS_LINE.test(podText)) {
		return podText;
	}
	// Directly before the first active source the app already declares
	const firstSource = FIRST_SOURCE.exec(podText);
	if (firstSource) {
		return insertAt(podText, firstSource.index, `${PODSPECS_SOURCE}\n`);
	}
	// Otherwise both sources, after the require_relative line Capacitor generates, or at the top
	const block = `${PODSPECS_SOURCE}\n${CDN_SOURCE}\n`;
	const require = REQUIRE_LINE.exec(podText);
	if (!require) {
		return `${block}\n${podText}`;
	}
	const end = require.index + require[0].length;
	return insertAt(podText, end, (require[0].endsWith('\n') ? '' : '\n') + `\n${block}`);
}

// `pod install` stops when Podfile.lock holds another version of an Acoustic pod than the Podfile pins. This happens
// in the usual order: the first `npx cap sync` resolves the unpinned pod of the Cordova plugin to the latest version,
// then this script pins the Notification Service pods to the validated one. Only a pod update clears it, and `pod
// install` then fails with "could not find compatible versions", so say so here.
function warnStalePodLock(opts, appDir) {
	const iosVersion = nativeSdkVersions(opts).ios;
	const lock = readOr(path.join(appDir, 'Podfile.lock'), '');
	if (!iosVersion || !lock) {
		return;
	}
	const stale = [];
	const entry = /^  - (AcousticMobilePush(?:Notification)?(?:Debug)?) \(([^)=][^)]*)\)/gm;
	let match;
	while ((match = entry.exec(lock)) !== null) {
		if (match[2] !== iosVersion) {
			stale.push(`${match[1]} ${match[2]}`);
		}
	}
	if (stale.length > 0) {
		const pods = [...new Set(stale.map(s => s.split(' ')[0]))];
		log('ios', `warning  Podfile.lock holds ${stale.join(', ')} but iOSVersion is ${iosVersion}: run "pod update ${pods.join(' ')}" in ios/App, otherwise "pod install" stops on the conflict`);
	}
}

function setupPodSources(opts, appDir) {
	const podfile = path.join(appDir, 'Podfile');
	const podText = readOr(podfile, '');
	if (!podText) {
		log('ios', 'warning  Podfile not found (run "npx cap add ios --packagemanager CocoaPods")');
		return;
	}
	writeIfChanged(opts, podfile, podfileWithSources(podText), 'ios', 'Podfile (go-acoustic/PodSpecs source)');
}

function setupIos(opts) {
	const appDir = path.join(opts.project, 'ios/App');
	if (!fs.existsSync(appDir)) {
		log('ios', 'skipped  ios/ not found (run "npx cap add ios --packagemanager CocoaPods")');
		return;
	}
	const projectFile = path.join(appDir, 'App.xcodeproj');
	const target = path.join(appDir, 'App');

	// 1. MceConfig.json. Created when missing; an existing file only gets a location section if
	// the location, geofence or beacon plugin is installed and the file has none.
	const plugins = installedPlugins(opts);
	const needsLocation = ['location', 'geofence', 'beacon'].some(p => plugins.includes(p));
	const configFile = path.join(target, 'MceConfig.json');
	let config = null;
	if (fs.existsSync(configFile)) {
		config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
	} else if (!opts.serverUrl || !opts.iosDevKey || !opts.iosProdKey) {
		log('ios', 'skipped  MceConfig.json: --server-url, --ios-dev-key and --ios-prod-key are needed');
	} else {
		config = {
			appDelegateClass: 'App.AppDelegate', baseUrl: opts.serverUrl,
			appKey: { dev: opts.iosDevKey, prod: opts.iosProdKey },
			invalidateExistingUser: false, autoReinitialize: true, autoInitialize: true,
			sessionTimeout: 20, loglevel: opts.logLevel, logfile: false
		};
	}
	if (config) {
		if (needsLocation && !config.location) {
			config.location = {
				autoInitialize: true,
				geofence: {
					search: { maximumRadius: 2500000, defaultRadius: 10000, maximumCount: 100, maximumQuantity: 20, minimumQuantity: 1 },
					accuracy: '3km'
				},
				sync: { syncRadius: 100000, syncInterval: 300 }
			};
			if (plugins.includes('beacon')) {
				if (opts.beaconUuid) {
					config.location.ibeacon = { UUID: opts.beaconUuid };
				} else {
					log('ios', 'warning  beacon plugin installed: pass --beacon-uuid or add location.ibeacon.UUID to MceConfig.json');
				}
			}
		}
		writeIfChanged(opts, configFile, JSON.stringify(config, null, 2) + '\n', 'ios', 'App/MceConfig.json');
	}

	// 2. Entitlements (aps-environment) and Info.plist background mode
	const entitlementsFile = path.join(target, 'App.entitlements');
	if (!fs.existsSync(entitlementsFile)) {
		writeIfChanged(opts, entitlementsFile,
			'<?xml version="1.0" encoding="UTF-8"?>\n' +
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
			'<plist version="1.0">\n<dict>\n\t<key>aps-environment</key>\n\t<string>development</string>\n</dict>\n</plist>\n',
			'ios', 'App/App.entitlements (aps-environment development; use production for App Store builds)');
	} else {
		log('ios', 'ok       App/App.entitlements (kept)');
	}

	const plistFile = path.join(target, 'Info.plist');
	const modes = ['remote-notification'];
	const strings = {};
	if (plugins.includes('location') || plugins.includes('geofence') || plugins.includes('beacon')) {
		modes.push('fetch', 'location', 'bluetooth-central', 'bluetooth-peripheral');
		['NSLocationWhenInUseUsageDescription', 'NSLocationAlwaysUsageDescription', 'NSLocationAlwaysAndWhenInUseUsageDescription']
			.forEach(k => { strings[k] = LOCATION_USAGE; });
	}
	if (plugins.includes('calendar')) {
		strings.NSCalendarsUsageDescription = 'Add interesting things to the calendar';
	}
	updatePlist(opts, plistFile, modes, strings);

	// 3. CocoaPods sources
	setupPodSources(opts, appDir);

	// 4. Notification Service Extension files, then the Xcode project
	const withExtension = plugins.includes('ios-notification-service') && setupNotificationService(opts, appDir, target, projectFile);
	if (opts.dryRun) {
		log('ios', 'skipped  Xcode project update (dry run)');
	} else {
		const helper = path.join(__dirname, 'capacitorSetupIos.rb');
		const args = [helper, projectFile].concat(withExtension ? ['--notification-service'] : []);
		const result = spawnSync('ruby', args, { encoding: 'utf8' });
		if (result.error || result.status !== 0) {
			log('ios', `warning  Xcode project not updated (needs the ruby gem "xcodeproj", installed with CocoaPods): ${(result.stderr || result.error || '').toString().trim()}`);
			log('ios', 'warning  add MceConfig.json and App.entitlements to the App target in Xcode by hand');
		} else {
			result.stdout.trim().split('\n').filter(Boolean).forEach(line => log('ios', line));
		}
	}

	warnStalePodLock(opts, appDir);
	setupCapacitorConfig(opts);
}

function main() {
	const opts = parseArgs(process.argv.slice(2));
	if (opts.help) {
		console.log('Options: --project DIR  --server-url URL  --android-app-key KEY  --ios-dev-key KEY\n' +
			'         --ios-prod-key KEY  --log-level LEVEL  --dry-run');
		return;
	}
	if (!fs.existsSync(path.join(opts.project, 'package.json'))) {
		throw new Error(`No package.json in ${opts.project}: run from the Capacitor project root or pass --project`);
	}
	setupAndroid(opts);
	setupIos(opts);
	console.log(`${opts.dryRun ? '[dry run] ' : ''}Acoustic Mobile Push Capacitor setup\n${report.join('\n')}`);
	if (report.some(l => l.includes('warning'))) {
		console.log('\nSee documentation/CAPACITOR.md in the Acoustic-Mobile-Push-Cordova repository for the steps marked as warning.');
	}
}

if (require.main === module) {
	try {
		main();
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
}

module.exports = { podfileWithSources };
