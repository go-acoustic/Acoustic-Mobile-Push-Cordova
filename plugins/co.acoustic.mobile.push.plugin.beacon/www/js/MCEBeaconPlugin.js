"use strict";
/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */
/**
Acoustic MCE iBeacon Cordova Plugin
@module
*/
var MCEBeaconPlugin;
(function (MCEBeaconPlugin) {
    /**
    Query the current iBeacon regions.
    @param {BeaconRegionsCallback} callback The callback with the current iBeacon regions.
    */
    MCEBeaconPlugin.beaconRegions = function (callback) {
        cordova.exec(callback, MCEPlugin.error, "MCEBeaconPlugin", "beaconRegions", []);
    };
    /**
    Set callback for entering iBeacon regions
    @param {BeaconCallback} callback Callback function for entering iBeacon regions.
    */
    MCEBeaconPlugin.setBeaconEnterCallback = function (callback) {
        MCEPlugin.pauseResumeCallback(function () {
            cordova.exec(callback, MCEPlugin.error, "MCEBeaconPlugin", "setBeaconEnterCallback", [false]);
        }, function () {
            cordova.exec(callback, MCEPlugin.error, "MCEBeaconPlugin", "setBeaconEnterCallback", [true]);
        });
    };
    /**
    Set callback for exiting iBeacon regions
    @param {BeaconCallback} callback Callback function for exiting iBeacon regions.
    */
    MCEBeaconPlugin.setBeaconExitCallback = function (callback) {
        MCEPlugin.pauseResumeCallback(function () {
            cordova.exec(null, null, "MCEBeaconPlugin", "setBeaconExitCallback", [false]);
        }, function () {
            cordova.exec(callback, MCEPlugin.error, "MCEBeaconPlugin", "setBeaconExitCallback", [true]);
        });
    };
    /**
    Query if iBeacons are enabled or disabled
    @param {BeaconEnabledCallback} callback response callback.
    */
    MCEBeaconPlugin.beaconEnabled = function (callback) {
        cordova.exec(callback, MCEPlugin.error, "MCEBeaconPlugin", "beaconEnabled", []);
    };
    /**
    Query if iBeacon global UUID currently setup.
    @param {BeaconUUIDCallback} callback response callback.
    */
    MCEBeaconPlugin.beaconUUID = function (callback) {
        cordova.exec(callback, MCEPlugin.error, "MCEBeaconPlugin", "beaconUUID", []);
    };
})(MCEBeaconPlugin || (MCEBeaconPlugin = {}));
module.exports = MCEBeaconPlugin;
