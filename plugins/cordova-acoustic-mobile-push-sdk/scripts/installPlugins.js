/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */
const fs           = require('fs');
const plist        = require('plist');
const path         = require('path');
const ncp          = require('ncp');
const xml2js       = require('xml2js');
const chalk        = require('chalk');
const { execSync } = require('child_process');

function containsStanza(array, stanza, type) {
	for(var i = 0; i < array.length; i++) {
		if(array[i]['$']['android:name'] == stanza[type]['$']['android:name']) {
			return true
		}
	}
	return false;
}

function verifyStanza(array, stanzaString) {
	if(typeof array == "undefined") {
		array = [];
	}
	new xml2js.Parser().parseString(stanzaString, function (err, stanza) {
		const types = Object.getOwnPropertyNames(stanza);
		const type = types[0];
		if( !containsStanza(array, stanza, type) ) {
			console.log("Adding required " + type + " stanza to AndroidManifest.xml");
			array.push( stanza[type] )
		}
	});
	return array;
}

function modifyManifest(installDirectory) {
	let manifestPath = path.join(installDirectory, "android", "app", "src", "main", "AndroidManifest.xml");
	new xml2js.Parser().parseString(fs.readFileSync(manifestPath), function (err, document) {

		console.log("Adding required receivers to AndroidManifest.xml");
		var receivers = document.manifest.application[0].receiver;
		[
			'<receiver android:name="co.acoustic.mobile.push.sdk.wi.AlarmReceiver" tools:replace="android:exported" android:exported="true"><intent-filter><action android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter><intent-filter><action android:name="android.intent.action.TIMEZONE_CHANGED" /></intent-filter><intent-filter><action android:name="android.intent.action.PACKAGE_REPLACED" /><data android:scheme="package" /></intent-filter><intent-filter><action android:name="android.intent.action.LOCALE_CHANGED" /></intent-filter></receiver>',
			'<receiver android:name="co.acoustic.mobile.push.RNAcousticMobilePushBroadcastReceiver" android:exported="true"><intent-filter><action android:name="co.acoustic.mobile.push.sdk.NOTIFIER" /></intent-filter></receiver>',
			'<receiver android:name="co.acoustic.mobile.push.sdk.notification.NotifActionReceiver" />',
			'<receiver android:name="co.acoustic.mobile.push.sdk.location.LocationBroadcastReceiver"/>'

		].forEach((receiver) => {
			receivers = verifyStanza(receivers, receiver);
		});
		document.manifest.application[0].receiver = receivers;

		console.log("Adding required providers to AndroidManifest.xml");
		var providers = document.manifest.application[0].provider;
		var provider = '<provider android:name="co.acoustic.mobile.push.sdk.db.Provider" android:authorities="${applicationId}.MCE_PROVIDER" android:exported="false" />';
		document.manifest.application[0].provider = verifyStanza(providers, provider);

		console.log("Adding required services to AndroidManifest.xml");
		var services = document.manifest.application[0].service;
		[
			'<service android:name="co.acoustic.mobile.push.sdk.session.SessionTrackingIntentService"/>',
			'<service android:name="co.acoustic.mobile.push.sdk.events.EventsAlarmListener" />',
			'<service android:name="co.acoustic.mobile.push.sdk.registration.PhoneHomeIntentService" />',
			'<service android:name="co.acoustic.mobile.push.sdk.registration.RegistrationIntentService" />',
			'<service android:name="co.acoustic.mobile.push.sdk.attributes.AttributesQueueConsumer" />',
			'<service android:name="co.acoustic.mobile.push.sdk.job.MceJobService" android:permission="android.permission.BIND_JOB_SERVICE"/>',
			'<service android:name="co.acoustic.mobile.push.sdk.messaging.fcm.FcmMessagingService"><intent-filter><action android:name="com.google.firebase.MESSAGING_EVENT"/></intent-filter></service>'
		].forEach((service) => {
			services = verifyStanza(services, service);
		});
		document.manifest.application[0].service = services;

		console.log("Adding internet, wake lock, boot, vibrate and call_phone permisssions to AndroidManifest.xml");
		var permissions = document.manifest['uses-permission'];
		[
			'<uses-permission android:name="android.permission.INTERNET"/>',
			'<uses-permission android:name="android.permission.WAKE_LOCK"/>',
			'<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>',
			'<uses-permission android:name="android.permission.VIBRATE"/>',
			'<uses-permission android:name="android.permission.CALL_PHONE"/>'
		].forEach((permission) => {
			permissions = verifyStanza(permissions, permission);
		});
		document.manifest['uses-permission'] = permissions;

		var output = new xml2js.Builder().buildObject(document);
		fs.writeFileSync(manifestPath, output);
	});
}

function modifyInfoPlist(mainAppPath) {
	if(!fs.existsSync(mainAppPath) || !fs.lstatSync(mainAppPath).isDirectory()) {
		console.error("Incorrect main app path: " + mainAppPath);
		return;
	}

	const infoPath = path.join(mainAppPath, "Info.plist");
	if(!fs.existsSync(infoPath) || !fs.lstatSync(infoPath).isFile()) {
		console.error("Couldn't locate Info.plist.");
		return;
	}

	var infoPlist = plist.parse(fs.readFileSync(infoPath, 'utf8'));
	if(typeof infoPlist.UIBackgroundModes == "undefined") {
		infoPlist.UIBackgroundModes = [];
	}

	var backgroundSet = new Set(infoPlist.UIBackgroundModes);
	console.log("Adding remote-notification and fetch to UIBackgroundModes of info.plist");
	backgroundSet.add("remote-notification");
	backgroundSet.add("fetch");
	infoPlist.UIBackgroundModes = Array.from(backgroundSet);

	fs.writeFileSync(infoPath, plist.build(infoPlist), "utf8");
}

function findMainPath(installDirectory) {
	if(!fs.existsSync(installDirectory)) {
		console.error("Couldn't locate install directory.");
		return;
	}

	const iosDirectory = path.join(installDirectory, 'ios');
	var directory;
	fs.readdirSync(iosDirectory).forEach((basename) => {
		const mainPath = path.join(iosDirectory, basename);
		if(fs.lstatSync(mainPath).isDirectory()) {
			const filename = path.join(mainPath, "main.m");
			if(fs.existsSync(filename)) {
				directory = mainPath;
			}
		}
	});
	return directory;
}

function replaceMain(mainAppPath) {
	if(!fs.existsSync(mainAppPath) || !fs.lstatSync(mainAppPath).isDirectory()) {
		console.error(chalk.red("Incorrect main app path: " + mainAppPath));
		return;
	}

	const mainPath = path.join(mainAppPath, "main.m");
	if(!fs.existsSync(mainPath) || !fs.lstatSync(mainPath).isFile()) {
		console.error(chalk.red("Couldn't locate main.m."));
		return;
	}

	const backupMainPath = mainPath + "-backup";
	if(!fs.existsSync(backupMainPath)) {
		console.log("Backing up main.m as main.m-backup");
		fs.renameSync(mainPath, backupMainPath);

		console.log("Replacing main.m with SDK provided code");
		fs.copyFileSync( path.join("postinstall", "ios", "main.m"), mainPath);
	}
}

function addAndroidConfigFile(installDirectory) {
	const configName = 'MceConfig.json';
	const destinationDirectory = path.join(installDirectory, "android", "app", "src", "main", "assets");
	const configPath = path.join(destinationDirectory, configName);

	if(!fs.existsSync(destinationDirectory)) {
		console.log('Creating asset path');
		fs.mkdirSync(destinationDirectory, { recursive: true });
	}

	if(!fs.existsSync(configPath)) {
		console.log('Copying MceConfig.json file into Android project');
		ncp.ncp( path.join('postinstall', 'android', configName), configPath);
	}
}

function stringExists(name, strings) {
	for(var i=0; i<strings.resources.string.length; i++) {
		if(strings.resources.string[i]['$'].name == name) {
			return true;
		}
	}
	return false;
}

function verifyString(name, strings) {
	if(!stringExists(name, strings)) {
		new xml2js.Parser().parseString('<string name="' + name + '">REPLACE THIS PLACEHOLDER</string>', function (err, string) {
			strings.resources.string.push( string.string );
		});
	}
	return strings;
}

function modifyStrings(installDirectory) {
	if(process.env.MCE_RN_NOSTRINGS) {
		console.log(chalk.yellow.bold("Android strings.xml will not be modified because MCE_RN_NOSTRINGS environment flag detected."));
		return;
	}

	let stringsPath = path.join(installDirectory, "android", "app", "src", "main", "res", "values", "strings.xml");

	console.log("Modifying strings.xml in Android project");
	new xml2js.Parser().parseString(fs.readFileSync(stringsPath), function (err, strings) {
		// TODO: it seems that both strings cannot be added to strings.xml as build will
		// fail with information about duplicated entries
		return;

		["google_api_key", "google_app_id"].forEach((name) => {
			verifyString(name, strings);
		});
		var output = new xml2js.Builder().buildObject(strings);
		fs.writeFileSync(stringsPath, output);
	});
}

function addiOSConfigFile(mainAppPath) {
	const configName = 'MceConfig.json';
	const configPath = path.join(mainAppPath, configName);
	if(!fs.existsSync(configPath)) {
		console.log("Copying MceConfig.json file into iOS project - " + configPath);
		ncp.ncp( path.join('postinstall', 'ios', configName), configPath);
	} else {
		console.log("MceConfig.json already exists at " + configPath);
	}
}

if(process.env.MCE_RN_NOCONFIG) {
	console.log(chalk.yellow.bold("Acoustic Mobile Push SDK installed, but will not be auto configured because MCE_RN_NOCONFIG environment flag detected."));
	return;
}












/**
 * Used to add CampaignConfig.json.
 * 
 * @param {*} currentAppWorkingDirectory Current application directory where cordova plugin add or npm install is being ran.
 */
function addOrReplaceMobilePushConfigFile(currentAppWorkingDirectory) {
	const configName        = 'CampaignConfig.json';
	const pluginPath        = path.resolve(__dirname, '..');
	const defaultConfigFile = path.join(pluginPath, configName);
	const appConfigFile     = path.join(currentAppWorkingDirectory, configName);

	logMessageInfo("Add or Replace CampaignConfig.json file into the App at " + currentAppWorkingDirectory);

	if(!fs.existsSync(appConfigFile)) {
		logMessageInfo("Add default CampaignConfig.json file into project - " + appConfigFile);
		fs.copyFileSync(defaultConfigFile, appConfigFile);
	} else {
		logMessageWarning("CampaignConfig.json already exists at " + currentAppWorkingDirectory + "/" + configName);
	}

  return {
    pluginPath:  pluginPath,
    defaultConfigFile: defaultConfigFile,
    appConfigFile: appConfigFile
  };
}

/**
 * Used to read current settings in CampaignConfig.json and creating MceConfig.json.
 * 
 * @param {*} currentAppWorkingDirectory Current application directory where cordova plugin add or npm install is being ran.
 * @param {*} pluginPath Path to plugin.
 * @param {*} campaignConfigFile CampaignConfig.json file.
 */
function readAndSaveMceConfig(currentAppWorkingDirectory, pluginPath, campaignConfigFile) {
	try {
	  // Read the file synchronously
	  const fileData = fs.readFileSync(campaignConfigFile, 'utf8');
	  const jsonData = JSON.parse(fileData);
  
	  if (jsonData.android && jsonData.iOS) {
			if (jsonData.android) {
				const androidConfig = JSON.stringify(jsonData.android, null, 2);
				const androidDestinationPath = path.join(pluginPath, 'postinstall/android/MceConfig.json');
				saveConfig(androidConfig, androidDestinationPath);
			}
  
			if (jsonData.iOS) {
				const iosConfig = JSON.stringify(jsonData.iOS, null, 2);
				const iosDestinationPath = path.join(pluginPath, 'postinstall/ios/MceConfig.json');
				saveConfig(iosConfig, iosDestinationPath);
			}
	  } else {
			logMessageError(`No "android/ios" object found in the ${campaignConfigFile} file.`);
		}

		if (jsonData.plugins) {
			managePlugins(currentAppWorkingDirectory, pluginPath, jsonData);
		} else {
			logMessageError("Plugins section missing from Campaign");
		}
	} catch (error) {
		if (error.code === 'ENOENT') { // Handle "file not found" error specifically
			logMessageError(`File not found: ${campaignConfigFile}`);
		} else {
			logMessageError(`Error reading or parsing ${campaignConfigFile} file: ${error}`);
		}
	}
}

/**
 * Used to save json configuration.
 * 
 * @param {*} configData Data to be saved.
 * @param {*} destinationPath Location to save file.
 */
function saveConfig(configData, destinationPath) {
	try {
	  fs.writeFileSync(destinationPath, configData, { flag: 'w' });
		logMessageInfo(`${destinationPath} saved successfully!`);
	} catch (error) {
		logMessageError(`Error saving ${destinationPath}:`, error);
	}
}

/**
 * Used to add or remove cordova plugin that are configured in CampaignConfig.json.
 * 
 * @param {*} currentAppWorkingDirectory Current application directory where cordova plugin add or npm install is being ran.
 * @param {*} pluginPath Path to plugin.
 * @param {*} configData CampaignConfig.json data.
 */
function managePlugins(currentAppWorkingDirectory, pluginPath, configData) {
	try {
		logMessageTitle("Install required cordova plugins...");
		let pluginName = "cordova-acoustic-mobile-push-sdk"
		if (pluginPath.includes('-beta')) {
			pluginName = `${pluginName}-beta`
		}
		let packagePluginPath = path.join(currentAppWorkingDirectory, 'node_modules', pluginName);
		// Android
		// updateConfigXMLPreference(currentAppWorkingDirectory, "androidAppkey", configData.android.appKey.prod);
		// iOS
		// updateConfigXMLPreference(currentAppWorkingDirectory, "iOSAppkey", configData.iOS.appKey.dev);
		// updateConfigXMLPreference(currentAppWorkingDirectory, "iOSProdkey", configData.iOS.appKey.prod);
		// updateConfigXMLPreference(currentAppWorkingDirectory, "serverUrl", configData.iOS.baseUrl);
		// updateConfigXMLPreference(currentAppWorkingDirectory, "logLevel", configData.iOS.logLevel);
		customAction       = configData.customAction;
		androidAppkey      = configData.android.appKey.prod;
		iOSAppkey          = configData.iOS.appKey.dev;
		iOSProdkey         = configData.iOS.appKey.prod;
		serverUrl          = configData.iOS.baseUrl;
		logLevel           = configData.iOS.loglevel;
		mceCanSyncOverride = configData.mceCanSyncOverride;

		const androidBuildExtrasGradleFile = path.join(currentAppWorkingDirectory, "platforms/android/cordova-acoustic-mobile-push-sdk/android-build-extras.gradle");
		if(fs.existsSync(androidBuildExtrasGradleFile)) {
			fs.unlinkSync(androidBuildExtrasGradleFile);
		}
		logMessageTitle(`Install base ${pluginName}`);
		updatePluginXMLPodName(packagePluginPath, configData.plugins.useRelease, configData);
		logMessageTitle(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${pluginName} --variable CUSTOM_ACTIONS="${customAction}" --variable ANDROID_APPKEY="${androidAppkey}" --variable IOS_DEV_APPKEY="${iOSAppkey}" --variable IOS_PROD_APPKEY="${iOSProdkey}" --variable SERVER_URL="${serverUrl}" --variable LOGLEVEL="${logLevel}" --variable MCE_CAN_SYNC_OVERRIDE="${mceCanSyncOverride}" --force`);
		execSync(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${pluginName} --variable CUSTOM_ACTIONS="${customAction}" --variable ANDROID_APPKEY="${androidAppkey}" --variable IOS_DEV_APPKEY="${iOSAppkey}" --variable IOS_PROD_APPKEY="${iOSProdkey}" --variable SERVER_URL="${serverUrl}" --variable LOGLEVEL="${logLevel}" --variable MCE_CAN_SYNC_OVERRIDE="${mceCanSyncOverride}" --force`, { stdio: 'inherit', cwd: process.cwd() });
	} catch (error) {
		console.error(`Failed to manage plugin ${plugin}:`, error);
	} finally {
		Object.entries(configData.plugins).forEach(([plugin, isEnabled]) => {
			if (plugin.includes('cordova-acoustic-mobile-push-sdk')) {
				return;
			}
			if (!plugin.includes('cordova-acoustic-mobile-push-')) {
				return;
			}

			logMessageTitle(`Install ${plugin}`);

			let installed = isNPMPluginInstalled(currentAppWorkingDirectory, plugin);
			let cordovaPluginInstalled = isPluginInstalled(currentAppWorkingDirectory, plugin);
			let update = false;

			try {
				logMessageInfo(`Review ${plugin}:installed=${installed}`);
				if (isEnabled == true && !installed) {
					logMessageInfo(`Adding ${plugin}...`);
					if (plugin.includes('cordova-acoustic-mobile-push-plugin-location')) {
						syncRadius   = configData.android.location.sync.syncRadius;// or configData.iOS.location.sync.syncRadius
						syncInterval = configData.android.location.sync.syncInterval;// or configData.iOS.location.sync.syncInterval
						if(cordovaPluginInstalled) {
							runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin rm ${plugin} --variable SYNC_RADIUS="${syncRadius}" --variable SYNC_INTERVAL="${syncInterval}"`);
							// runExecSync(`cd "${currentAppWorkingDirectory}" && npm uninstall ${plugin} --ignore-scripts`);
						}
						runExecSync(`cd "${currentAppWorkingDirectory}" && npm install ${plugin} --ignore-scripts`);
						runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${plugin} --variable SYNC_RADIUS="${syncRadius}" --variable SYNC_INTERVAL="${syncInterval}"`);
						update = true;
					} else if (plugin.includes('cordova-acoustic-mobile-push-plugin-beacon')) {
						myUuid = configData.android.location.ibeacon.uuid;// or configData.iOS.location.ibeacon.UUID
						if (cordovaPluginInstalled) {
							runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin rm ${plugin} --variable UUID="${myUuid}"`);
							// runExecSync(`cd "${currentAppWorkingDirectory}" && npm uninstall ${plugin} --ignore-scripts`);
						}
						// runExecSync(`cd "${currentAppWorkingDirectory}" && npm install ${plugin} --ignore-scripts`);
						runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${plugin} --variable UUID="${myUuid}"`);
						update = true;
					} else {
						if (cordovaPluginInstalled) {
							runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin rm ${plugin}`);
							// runExecSync(`cd "${currentAppWorkingDirectory}" && npm uninstall ${plugin} --ignore-scripts`);
						}
						// runExecSync(`cd "${currentAppWorkingDirectory}" && npm install ${plugin} --ignore-scripts`);
						runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${plugin}`);
						update = true;
					}
				} else if (isEnabled == false && installed) {
					logMessageInfo(`Removing ${plugin}...`);
					runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin rm ${plugin}`);
					// runExecSync(`cd "${currentAppWorkingDirectory}" && npm uninstall ${plugin} --ignore-scripts`);
				} else {
					logMessageInfo(`Skip for ${plugin} with ${isEnabled} which is installed using ${installed}`);
					// update = true; review 
				}
			} catch (error) {
				logMessageError(`Failed to manage plugin ${plugin}:`, error);
			}

			if (update) {
				packagePluginPath = path.join(currentAppWorkingDirectory, 'node_modules', plugin);
				// Update podfile to use
				if (!plugin.includes('cordova-acoustic-mobile-push-plugin-dial')) {
					updatePluginXMLPodName(packagePluginPath, configData.plugins.useRelease, configData);
				}
				// Update gradle for beta/release version
				if (!plugin.includes('cordova-acoustic-mobile-push-plugin-ios-notification-service') &&
					!plugin.includes('cordova-acoustic-mobile-push-plugin-action-menu') &&
					!plugin.includes('cordova-acoustic-mobile-push-plugin-dial') &&
					!plugin.includes('cordova-acoustic-mobile-push-plugin-passbook')) {
					updateBuildExtrasGradle(packagePluginPath, configData.plugins.useRelease);
				}
			}
		});
	}
}

/**
 * This function will print and run command.
 * 
 * @param {*} cmdToRun Command to run.
 */
function runExecSync(cmdToRun) {
	try {
		console.log(cmdToRun);
		const result = execSync(`${cmdToRun}`);
		return result !== null ? result.toString() : result;
	} catch (error) {
		console.error(`Failed to run command:${cmdToRun}:`, error);
	}
}

/**
 * Used to update preference values in config.xml file.
 * 
 * @param {*} currentAppWorkingDirectory Current application directory where cordova plugin add or npm install is being ran.
 * @param {*} nam Name property in xml.
 * @param {*} val Value in xml.
 */
function updateConfigXMLPreference(currentAppWorkingDirectory, nam, val) {
	try {
		let appName = currentAppWorkingDirectory.substring(currentAppWorkingDirectory.lastIndexOf('/') + 1);
		let configPathEnd = (`platforms/ios/${appName}/config.xml`);
		let configPath = path.join(currentAppWorkingDirectory, configPathEnd);
		let configContent = fs.readFileSync(configPath, 'utf8');
		const preferenceToAdd = `<preference name="${nam}" value="${val}" />`;
		const regx = new RegExp(`\\<preference\\s*name="` + nam + `"\\s*value="true"\\s*/>`, 'gi');

		if (regx.test(configContent)) {
			configContent = configContent.replace(regx, preferenceToAdd);
		} else {
			// Add 
			const widgetString = `    ${preferenceToAdd}\n</widget>\n`;
			let configContentArray = configContent.split('</widget>');
			configContent = configContentArray[0] + widgetString + configContentArray[1];
		}
		fs.writeFileSync(configPath, configContent, 'utf8');
		console.log(`Add preference to ${configPath}`);
	} catch (error) {
		console.error(`Error updating ${configPath}:`, error);
	}
}

/**
 * Check if npm package has been installed.
 * 
 * @param {*} pluginName Plugin name to be tested
 * @returns Whether plugin is already installed.
 */
function isNPMPluginInstalled(currentAppWorkingDirectory, pluginName) {
	const appPackageJsonFile = path.join(currentAppWorkingDirectory, 'package.json');
	const packageJsonData    = fs.readFileSync(appPackageJsonFile, 'utf8');
	const packageJson        = JSON.parse(packageJsonData);
	return packageJson.dependencies && packageJson.dependencies[pluginName] ||
		   packageJson.devDependencies && packageJson.devDependencies[pluginName] ||
			 false;
}

/**
 * Check if plugin has been installed.
 * 
 * @param {*} pluginName Plugin name to be tested
 * @returns Whether plugin is already installed.
 */
function isPluginInstalled(currentAppWorkingDirectory, pluginName) {
	var cordovaPluginList = execSync(`cd "${currentAppWorkingDirectory}" && cordova plugin list`).toString();
	return cordovaPluginList ? cordovaPluginList.includes(pluginName) : false;
}

/**
 * Update the podname to be used in podfile.
 * 
 * @param {*} pluginPath Path to plugin.
 * @param {*} isRelease Whether configuration is to use release.
 */
function updatePluginXMLPodName(plugPath, isRelease, configData) {
	try {
		let pluginPath = path.join(plugPath, "plugin.xml");
		let pluginContent = fs.readFileSync(pluginPath, 'utf8');
		let podNameRegex = /<pod name="AcousticMobilePush.*\/>/;
		let podname = isRelease ? "AcousticMobilePush" : "AcousticMobilePushDebug";

		if (plugPath.includes('cordova-acoustic-mobile-push-plugin-ios-notification-service')) {
			podNameRegex = /<pod name="AcousticMobilePushNotification.*\/>/;
			podname = isRelease ? "AcousticMobilePushNotification" : "AcousticMobilePushNotificationDebug";
		}

		if (podNameRegex.test(pluginContent)) {
			let version = '';
			if (configData.iOSVersion) {
				version = `spec="${configData.iOSVersion}" `
			}
			const podNameUpdate = `<pod name="${podname}" ${version}/>`;
			pluginContent = pluginContent.replace(podNameRegex, podNameUpdate);

			fs.writeFileSync(pluginPath, pluginContent, 'utf8');
			logMessageInfo(`Update to use podName: ${podname} for ${pluginPath}`);
		}
	} catch (error) {
		logMessageError(`Error updating ${pluginPath}:`, error);
	}
}

/**
 * Adjust build-extras.gradle which is used to indicate to beta or release version of Android.
 * 
 * @param {*} pluginPath Path to plugin.
 * @param {*} isRelease Whether configuration is to use release.
 */
function updateBuildExtrasGradle(plugPath, isRelease) {
	try {
		let pluginPath = path.join(plugPath, "src/android/build-extras.gradle");
		let pluginContent = fs.readFileSync(pluginPath, 'utf8');
		const mavenUrlRegex = /maven\s*{\s*url\s*\"https:\/\/s01\.oss\.sonatype\.org\/content\/repositories\/staging"\s*}/;

		if (isRelease && mavenUrlRegex.test(pluginContent)) {
			// Remove Maven URL if useRelease is true and it exists
			pluginContent = pluginContent.replace(mavenUrlRegex, '');
			fs.writeFileSync(pluginPath, pluginContent, 'utf8');
			logMessageInfo('Maven URL removed from build-extras.gradle');
		} else if (!isRelease && !mavenUrlRegex.test(pluginContent)) {
			// Add Maven URL if useRelease is true and it doesn't already exist
			const mavenUrlString = 'mavenCentral()\n  maven { url "https://s01.oss.sonatype.org/content/repositories/staging" }\n';
			let pluginContentArray = pluginContent.split('mavenCentral()')
			pluginContent = pluginContentArray[0] + mavenUrlString + pluginContentArray[1]
			fs.writeFileSync(pluginPath, pluginContent, 'utf8');
			logMessageInfo(`Maven URL added to ${pluginPath}`);
		} else {
			logMessageWarning(`No changes needed in ${pluginPath}`);
		}
	} catch (error) {
		logMessageError(`Error updating ${pluginPath}:`, error);
	}
}

/**
 * Display a message in green in terminal.
 * 
 * @param {*} msg 
 */
function logMessageTitle(msg) {
	console.log(chalk.green.bold(msg));
}

/**
 * Display a message in blue in terminal.
 * 
 * @param {*} msg 
 */
function logMessageInfo(msg) {
	console.log(chalk.blue.bold(msg));
}

/**
 * Display a message in yellow in terminal.
 * 
 * @param {*} msg 
 */
function logMessageWarning(msg) {
	console.log(chalk.yellow.bold(msg));
}

/**
 * Display a message in red in terminal.
 * 
 * @param {*} msg 
 */
function logMessageError(msg) {
	console.log(chalk.red.bold(msg));
}

function getInstallDirectory() {
	let installDirectory = process.cwd();
	if (installDirectory.includes('node_modules')) {
		let p = installDirectory.split('node_modules')
		installDirectory = p[0]
	}
	return installDirectory;
}

/**
 * This will get latest release version from github for iOS.
 * 
 * @returns Latest release version.
 */
function getLatestiOSVersion() {
	return runExecSync(`curl -H "Accept: application/vnd.github.v3+json" https://api.github.com/repos/go-acoustic/Acoustic-Mobile-Push-iOS/releases | jq -r '.[0].tag_name'`);
}

/**
 * This will get latest release version from github for Android.
 * 
 * @returns Latest release version.
 */
function getLatestAndroidVersion() {
	return runExecSync(`curl -H "Accept: application/vnd.github.v3+json" https://api.github.com/repos/go-acoustic/Acoustic-Mobile-Push-Android/releases | jq -r '.[0].tag_name'`);
}

/**
 * Start install of sdk on application.
 */
function startInstall() {
	logMessageTitle('Setting up Acoustic Mobile Push SDK');

	if (process.env.npm_command == 'uninstall') {
		logMessageError('Skip for uninstall');
		return;
	}

	const currentAppWorkingDirectory = getInstallDirectory();
	const initPaths = addOrReplaceMobilePushConfigFile(currentAppWorkingDirectory);
	const pluginPath = initPaths.pluginPath;
	const defaultConfigFile = initPaths.defaultConfigFile;
	const appConfigFile = initPaths.appConfigFile;

	// Read and save corresponding ios/android json sections to postinstall folders, in the plugin project
	readAndSaveMceConfig(currentAppWorkingDirectory, pluginPath, appConfigFile);


// const mainAppPath = findMainPath(installDirectory);
// replaceMain(mainAppPath);
// modifyInfoPlist(mainAppPath);
// addiOSConfigFile(mainAppPath);
// addAndroidConfigFile(installDirectory);
// modifyManifest(installDirectory);
// modifyStrings(installDirectory);

// console.log(chalk.green("Installation Complete!"));

// console.log(chalk.blue.bold("\nPost Installation Steps\n"));
// console.log(chalk.blue('For react-native 0.59 and lower link the plugin with:'));
// console.log('react-native link react-native-acoustic-mobile-push\n');

// console.log(chalk.blue('iOS Support:'));
// console.log("1. Open the iOS project in Xcode.");
// console.log("2. In the `Capabilities` tab of the main app target, enable push notifications by turning the switch to the on position");
// console.log("3. Drag and drop `react-native-acoustic-mobile-push/AcousticMobilePush.framework` from the Finder into the target's `General` tab, under `Linked Frameworks and Libraries`. Verify that 'embed and sign' is selected.");
// console.log("4. Drag and drop `react-native-acoustic-mobile-push` folder from the Finder into the `Framework Search Paths` setting in the `Build Setting` tab of the new target.");
// console.log("5. Then add a new `Notification Service Extension` target");
// console.log("6. Drag and drop `react-native-acoustic-mobile-push/Notification Service/AcousticMobilePushNotification.framework` from the Finder into the new target's `General` tab, under `Linked Frameworks and Libraries`.");
// console.log("7. Drag and drop `react-native-acoustic-mobile-push/Notification Service` folder from the Finder into the `Framework Search Paths` setting in the `Build Setting` tab of the new target.");
// console.log("8. Replace the contents of `NotificationService.m` and `NotificationService.h` with the ones provided in the `react-native-acoustic-mobile-push Notification Service` folder");
// console.log("9. Add the `MceConfig.json` file in the project directory to the xcode project to **Application** AND **Notification Service** targets");
// console.log("10. Adjust the `baseUrl` and `appKey`s provided by your account team");

// console.log(chalk.blue('Android Support:'));
// console.log("1. Open the Android project in Android Studio.");
// console.log("2. Replace the `google_api_key` and `google_app_id` placeholder values in `android/app/src/main/res/values/strings.xml` with your Google provided FCM credentials");
// console.log("3. Then edit the MceConfig.json file in the project and fill in the appKeys and baseUrl provided by your account team.\n");
}

startInstall();

