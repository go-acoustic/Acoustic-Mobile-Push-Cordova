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
 * Used to add CampaignConfig.json or update according to values found on appliaction.
 * 
 * @param {*} currentAppWorkingDirectory Current application directory where cordova plugin add or npm install is being ran.
 */
function addOrReplaceMobilePushConfigFile(currentAppWorkingDirectory) {
	const configName        = 'CampaignConfig.json';
	const pluginPath        = path.resolve(__dirname, '..');
	const defaultConfigFile = path.join(pluginPath, configName);
	const appConfigFile     = path.join(currentAppWorkingDirectory, configName);

	console.log("Add or Replace CampaignConfig.json file into the App at " + currentAppWorkingDirectory);

	if(!fs.existsSync(appConfigFile)) {
		console.log("Add default CampaignConfig.json file into project - " + appConfigFile);
		fs.copyFileSync(defaultConfigFile, appConfigFile);
	} else {
		console.log("CampaignConfig.json already exists at " + currentAppWorkingDirectory + "/" + configName);
	}
}

console.log(chalk.green.bold("Setting up Acoustic Mobile Push SDK, adding CampaignConfig.json to project"));
let installDirectory = process.cwd();
if (installDirectory.includes('node_modules')) {
	let p = installDirectory.split('node_modules')
	installDirectory = p[0]
}
addOrReplaceMobilePushConfigFile(installDirectory);