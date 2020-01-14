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
Acoustic MCE Geofence Cordova Plugin
@module MCEGeofencePlugin
*/

/**
@typedef Geofence
@property latitude {double} Latitude of center of geofence.
@property longitude {double} Longitude of center of geofence.
@property radius {double} Radius of geofence in meters.
@property locationId {string} Unique location identifier.
 */

/**
@callback geofencesNearCallback
@param geofences {Array.<Geofence>} List of geofences
 */

/**
Get geofences nearby provided latitude and longitude
@param callback {geofencesNearCallback} Callback data will be provided to
@param latitude {double} Latitude of center of area
@param longitude {double} Longitude of center of area
@param radius {double} Radius of area
*/
exports.geofencesNear = function(callback, latitude, longitude, radius) {
    cordova.exec(callback, this.error, "MCEGeofencePlugin", "geofencesNear", [latitude, longitude, radius]);
}

/**
@callback geofenceCallback
@param geofence {Geofence} Geofence entered or exited.
 */

/**
Set callback for entering geofences
@param callback {geofenceCallback} Callback executed when geofences are entered.
 */
exports.setGeofenceEnterCallback = function(callback) {
    MCEPlugin.pauseResumeCallback(function () {    
        cordova.exec(callback, this.error, "MCEGeofencePlugin", "setGeofenceEnterCallback", [false]);
    },function () {
        cordova.exec(callback, this.error, "MCEGeofencePlugin", "setGeofenceEnterCallback", [true]);
    });
}

/**
Set callback for exiting geofences
@param callback {geofenceCallback} Callback executed when geofences are exited.
 */
exports.setGeofenceExitCallback = function(callback) {
    MCEPlugin.pauseResumeCallback(function () {    
        cordova.exec(callback, this.error, "MCEGeofencePlugin", "setGeofenceExitCallback", [false]);
    },function () {
        cordova.exec(callback, this.error, "MCEGeofencePlugin", "setGeofenceExitCallback", [true]);
    });
}

/**
@callback geofenceEnabledCallback
@param status {boolean} True if geofences are enabled, false otherwise.
*/

/**
Query if geofences are enabled or disabled
@param callback {geofenceEnabledCallback} response callback.
 */
exports.geofenceEnabled = function(callback) {
    cordova.exec(callback, this.error, "MCEGeofencePlugin", "geofenceEnabled", []);
}