/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

import {} from "cordova-acoustic-mobile-push";
import {
    GeofenceCallback,
    GeofenceEnabledCallback,
    GeofencesNearCallback,
} from "./MCEGeofencePluginTypes";

/**
Acoustic MCE Geofence Cordova Plugin
*/
namespace MCEGeofencePlugin {
    cordova.exec(null, null, "MCEGeofencePlugin", null, []);

    /**
    Get geofences nearby provided latitude and longitude
    @param {GeofencesNearCallback} callback Callback data will be provided to
    @param {double} latitude Latitude of center of area
    @param {double} longitude Longitude of center of area
    @param {double} radius Radius of area
    */
    export const geofencesNear = function (
        callback: GeofencesNearCallback,
        latitude: number,
        longitude: number,
        radius: number
    ) {
        cordova.exec(
            callback,
            MCEPlugin.error,
            "MCEGeofencePlugin",
            "geofencesNear",
            [latitude, longitude, radius]
        );
    };

    /**
    Set callback for entering geofences
    @param {GeofenceCallback} callback Callback executed when geofences are entered.
    */
    export const setGeofenceEnterCallback = function (
        callback: GeofenceCallback
    ) {
        MCEPlugin.pauseResumeCallback(
            function () {
                cordova.exec(
                    callback,
                    MCEPlugin.error,
                    "MCEGeofencePlugin",
                    "setGeofenceEnterCallback",
                    [false]
                );
            },
            function () {
                cordova.exec(
                    callback,
                    MCEPlugin.error,
                    "MCEGeofencePlugin",
                    "setGeofenceEnterCallback",
                    [true]
                );
            }
        );
    };

    /**
    Set callback for exiting geofences
    @param {GeofenceCallback} callback Callback executed when geofences are exited.
    */
    export const setGeofenceExitCallback = function (
        callback: GeofenceCallback
    ) {
        MCEPlugin.pauseResumeCallback(
            function () {
                cordova.exec(
                    callback,
                    MCEPlugin.error,
                    "MCEGeofencePlugin",
                    "setGeofenceExitCallback",
                    [false]
                );
            },
            function () {
                cordova.exec(
                    callback,
                    MCEPlugin.error,
                    "MCEGeofencePlugin",
                    "setGeofenceExitCallback",
                    [true]
                );
            }
        );
    };

    /**
    Query if geofences are enabled or disabled
    @param {GeofenceEnabledCallback} callback response callback.
    */
    export const geofenceEnabled = function (
        callback: GeofenceEnabledCallback
    ) {
        cordova.exec(
            callback,
            MCEPlugin.error,
            "MCEGeofencePlugin",
            "geofenceEnabled",
            []
        );
    };
}

export = MCEGeofencePlugin;
