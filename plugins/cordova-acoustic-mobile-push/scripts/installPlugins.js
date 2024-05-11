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
function readAndSaveMceConfig(currentAppWorkingDirectory, pluginPath, jsonData) {
	try {
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
		logMessageWarning(`${destinationPath} saved successfully!`);
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
		let pluginName = "cordova-acoustic-mobile-push"
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

		logMessageTitle(`Install base ${pluginName}`);
		// Update iOS
		updatePluginXMLPodName(packagePluginPath, configData.plugins.useRelease, configData);
		// Update Android
		updateBuildExtrasGradle(packagePluginPath, configData);
		updateBuildGradleMobilePushVersion(currentAppWorkingDirectory, configData);
		logMessageTitle(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${pluginName} --variable CUSTOM_ACTIONS="${customAction}" --variable ANDROID_APPKEY="${androidAppkey}" --variable IOS_DEV_APPKEY="${iOSAppkey}" --variable IOS_PROD_APPKEY="${iOSProdkey}" --variable SERVER_URL="${serverUrl}" --variable LOGLEVEL="${logLevel}" --variable MCE_CAN_SYNC_OVERRIDE="${mceCanSyncOverride}" --force`);
		execSync(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${pluginName} --variable CUSTOM_ACTIONS="${customAction}" --variable ANDROID_APPKEY="${androidAppkey}" --variable IOS_DEV_APPKEY="${iOSAppkey}" --variable IOS_PROD_APPKEY="${iOSProdkey}" --variable SERVER_URL="${serverUrl}" --variable LOGLEVEL="${logLevel}" --variable MCE_CAN_SYNC_OVERRIDE="${mceCanSyncOverride}" --force`, { stdio: 'inherit', cwd: process.cwd() });
	} catch (error) {
		console.error(`Failed to manage plugin ${plugin}:`, error);
	} finally {
		Object.entries(configData.plugins).forEach(([plugin, isEnabled]) => {
			if (plugin === 'cordova-acoustic-mobile-push' || plugin === 'cordova-acoustic-mobile-push-beta') {
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
						}
						runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${plugin} --variable UUID="${myUuid}"`);
						update = true;
					} else {
						if (cordovaPluginInstalled) {
							runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin rm ${plugin}`);
						}
						runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin add ${plugin}`);
						update = true;
					}
				} else if (isEnabled == false && installed) {
					logMessageInfo(`Removing ${plugin}...`);
					runExecSync(`cd "${currentAppWorkingDirectory}" && cordova plugin rm ${plugin}`);
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
				updatePluginXMLPodName(packagePluginPath, configData.plugins.useRelease, configData);
				// Update gradle for beta/release version
				if (!plugin.includes('cordova-acoustic-mobile-push-plugin-ios-notification-service') &&
					!plugin.includes('cordova-acoustic-mobile-push-plugin-action-menu') &&
					!plugin.includes('cordova-acoustic-mobile-push-plugin-passbook')) {
					updateBuildExtrasGradle(packagePluginPath, configData);
				}
			}
		});
	}
}

function readMceConfig(campaignConfigFile) {
	let jsonData;
	try {
	  // Read the file synchronously
	  const fileData = fs.readFileSync(campaignConfigFile, 'utf8');
	  jsonData = JSON.parse(fileData);
	} catch (error) {
		logMessageError(`Failed to manage plugin ${plugin}:`, error);
	}
	return jsonData;
}

/**
 * Used to update MceConfig.json to application location.
 * 
 * @param {*} currentAppWorkingDirectory Current application directory where cordova plugin add or npm install is being ran.
 * @param {*} pluginPath Path to plugin.
 * @param {*} configData CampaignConfig.json data.
 */
function updateMceConfig(currentAppWorkingDirectory, pluginPath, configData) {
	updateMceConfigHelper(currentAppWorkingDirectory, pluginPath, configData, 'android');
	updateMceConfigHelper(currentAppWorkingDirectory, pluginPath, configData, 'ios');
}

/**
 * Used to help save MceConfig.json to application location.
 * 
 * @param {*} currentAppWorkingDirectory Current application directory where cordova plugin add or npm install is being ran.
 * @param {*} pluginPath Path to plugin.
 * @param {*} configData CampaignConfig.json data.
 * @param {*} platform Use 'android' or 'ios'.
 */
function updateMceConfigHelper(currentAppWorkingDirectory, pluginPath, configData, platform) {
	try {
		// Read the file synchronously
		const mceConfigPath = path.join(pluginPath, `postinstall/${platform}/MceConfig.json`);
		const fileData = fs.readFileSync(mceConfigPath, 'utf8');
	  const jsonData = JSON.parse(fileData);
	  
		let needsLocation = false;
		if (configData.plugins["cordova-acoustic-mobile-push-plugin-location"] || 
			configData.plugins["cordova-acoustic-mobile-push-plugin-location-beta"] ||
			configData.plugins["cordova-acoustic-mobile-push-plugin-beacon"] || 
			configData.plugins["cordova-acoustic-mobile-push-plugin-beacon-beta"] ||
			configData.plugins["cordova-acoustic-mobile-push-plugin-geofence"] || 
			configData.plugins["cordova-acoustic-mobile-push-plugin-geofence-beta"]) { 
			needsLocation = true;
		}

		if (!needsLocation) {
			// delete location config
			delete jsonData["location"];
		}
		const config = JSON.stringify(jsonData, null, 2);
		saveConfig(config, mceConfigPath);

		// copy to app
		let appPath = `platforms/${platform}/app/src/main/assets/MceConfig.json`;
		if (platform === 'ios') {
			appPath = `platforms/${platform}/MceConfig.json`;
		}
		const appDestinationPath = path.join(currentAppWorkingDirectory, appPath);
		saveConfig(config, appDestinationPath);

		// Update values in config.xml
		logMessageTitle('Update values in config.xml');
		const mainConfigXMLData = readXMLToJson(`${currentAppWorkingDirectory}/config.xml`);
		if (platform == 'ios' && jsonData) {
			const appConfigPath = `${currentAppWorkingDirectory}/platforms/ios/${mainConfigXMLData.widget.name[0]}/config.xml`;
			var xmlData = readXMLToJson(appConfigPath);
			// update file
			for (let i = 0; i < xmlData.widget.preference.length; i++) {
				var pref = xmlData.widget.preference[i]["$"]['name'];
				// logMessageTitle(pref);
				if (jsonData[pref] !== undefined) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData[pref];
				} else if (pref == 'prodAppKey' && jsonData.appKey.dev) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData.appKey.prod;
				} else if (pref == 'devAppKey' && jsonData.appKey.dev) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData.appKey.dev;
				} else if (pref == 'autoInitialize' && jsonData.location.autoInitialize) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData.location.autoInitialize;
				} else if (pref == 'beaconUUID' && jsonData.location.ibeacon.UUID) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData.location.ibeacon.UUID;
				} else if (pref == 'locationSyncRadius' && jsonData.location.sync.syncRadius) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData.location.sync.syncRadius;
				} else if (pref == 'locationSyncInterval' && jsonData.location.sync.syncInterval) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData.location.sync.syncInterval;
				} else if (pref == 'locationSyncInterval' && jsonData.location.sync.syncInterval) {
					xmlData.widget.preference[i]["$"]['value'] = jsonData.location.sync.syncInterval;
				}
			}
			writeJsonToXML(appConfigPath, xmlData);
		}
	} catch (error) {
		logMessageError(`Error reading or parsing ${mceConfigPath} file: ${error}`);
	}
}

/**
 * Return Javascript JSON object from XML file.
 * 
 * @param {*} configPath Path of the XML file.
 * @returns Javascript JSON object from XML file.
 */
function readXMLToJson(configPath) {
	var resultFound
	try {
		const xmlData = fs.readFileSync(configPath, 'utf8');
		logMessageTitle(`Original ${configPath}:`);
		logMessageInfo(`${xmlData}`);
		var parseString = require("xml2js").parseString;
		parseString(xmlData, function(err, result) {
			if (err) 
				logMessageError(`Parsing error for ${configPath}:\n${err}`);
			resultFound = result;
		})
	} catch (error) {
		logMessageError(`Failed to read xml ${configPath}:`, error);
	}
	return resultFound
}

/**
 * Write Javascript JSON object to XML file.
 * 
 * @param {*} configPath Path of the XML file to write.
 * @param {*} jsonDataToConvert Javascript JSON object to XML file.
 */
function writeJsonToXML(configPath, jsonDataToConvert) {
	try {
		var builder = new xml2js.Builder();
		var xml = builder.buildObject(jsonDataToConvert);
		saveConfig(xml, configPath);
		logMessageTitle(`Write to ${configPath}:`);
		logMessageInfo(`${xml}`);
	} catch (error) {
		logMessageError(`Failed to write xml ${configPath}:`, error);
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
 * @param {*} configData CampaignConfig.json file data.
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
 * @param {*} configData CampaignConfig.json file data.
 */
function updateBuildExtrasGradle(plugPath, configData) {
	try {
		let pluginPath = path.join(plugPath, "src/android/build-extras.gradle");
		let pluginContent = fs.readFileSync(pluginPath, 'utf8');
		const mavenUrlRegex = /maven\s*{\s*url\s*\"https:\/\/s01\.oss\.sonatype\.org\/content\/repositories\/staging"\s*}/;

		if (configData.plugins.useRelease && mavenUrlRegex.test(pluginContent)) {
			// Remove Maven URL if useRelease is true and it exists
			pluginContent = pluginContent.replace(mavenUrlRegex, '');
			fs.writeFileSync(pluginPath, pluginContent, 'utf8');
			logMessageInfo('Maven URL removed from build-extras.gradle');
		} else if (!configData.plugins.useRelease && !mavenUrlRegex.test(pluginContent)) {
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
 * @param {*} msg Message to display.
 */
function logMessageTitle(msg) {
	console.log(chalk.green.bold(msg));
}

/**
 * Display a message in blue in terminal.
 * 
 * @param {*} msg Message to display.
 */
function logMessageInfo(msg) {
	console.log(chalk.blue.bold(msg));
}

/**
 * Display a message in yellow in terminal.
 * 
 * @param {*} msg Message to display.
 */
function logMessageWarning(msg) {
	console.log(chalk.yellow.bold(msg));
}

/**
 * Display a message in red in terminal.
 * 
 * @param {*} msg Message to display.
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
 * Used to add default versions used for plugins in gradle.build.
 * 
 * @param {*} appPath Path of the application being integrated.
 */
function addGradlePropertiesToApp(appPath) {
	try {
		let appGradlePath = path.join(appPath, "platforms/android/build.gradle");
		let gradleContent = fs.readFileSync(appGradlePath, 'utf8');
		const mobilePushVersionRegex = /mobilePushVersion/;

		const libraryVersions = 
`allprojects {
	// This block encapsulates custom properties and makes them available to all
	project.ext {
		// The following are only a few examples of the types of properties you can define.
		// Sdk and tools
		mobilePushVersion = "3.9.22"
		androidxLibVersion = "1.6.0"
		playServicesBaseVersion = "18.3.0"
		playServicesLocationVersion = "21.0.1"
		firebaseCoreVersion = "19.0.2"
		firebaseMessagingVersion = "22.0.0"
	}
}`

		if(mobilePushVersionRegex.test(gradleContent)) {
			logMessageWarning(`No changes needed in ${appGradlePath} already has default values.`);
		} else {
			gradleContent = gradleContent.concat("\n", libraryVersions);
			fs.writeFileSync(appGradlePath, gradleContent, 'utf8');
			logMessageWarning(`Added default values in ${appGradlePath}`);
		}
	} catch (error) {
		logMessageError(`Error updating ${appGradlePath}:`, error);
	}
}

/**
 * Adjust build.gradle which is used to indicate which version of MobilePush to use.
 * 
 * @param {*} appPath Path of the application being integrated.
 * @param {*} configData CampaignConfig.json file data.
 */
function updateBuildGradleMobilePushVersion(appPath, configData) {
	try {
		let updateVersion = "+";
		let appGradlePath = path.join(appPath, "platforms/android/build.gradle");
		let gradleContent = fs.readFileSync(appGradlePath, 'utf8');
		const mobilePushVersionRegex = /mobilePushVersion = "(\d+\.\d+\.\d+|\+)"/;

		if (configData.androidVersion) {
			updateVersion = configData.androidVersion;
		}
		gradleContent = gradleContent.replace(mobilePushVersionRegex, `mobilePushVersion = "${updateVersion}"`);
		fs.writeFileSync(appGradlePath, gradleContent, 'utf8');
		logMessageInfo('Updated ${appGradlePath}');
	} catch (error) {
		logMessageError(`Error updating ${appGradlePath}:`, error);
	}
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

	addGradlePropertiesToApp(currentAppWorkingDirectory);

	// Read and save corresponding ios/android json sections to postinstall folders, in the plugin project
	const configData = readMceConfig(appConfigFile);
	readAndSaveMceConfig(currentAppWorkingDirectory, pluginPath, configData);
	updateMceConfig(currentAppWorkingDirectory, pluginPath, configData);

	logMessageTitle("Installation Complete!");
}

startInstall();
