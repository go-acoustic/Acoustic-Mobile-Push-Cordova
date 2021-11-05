/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

import {
    LocationAuthorizationCallback,
    LocationCallback,
} from "./MCELocationPluginTypes";
import {} from "co.acoustic.mobile.push.sdk";

/**
Acoustic MCE Location Cordova Plugin
*/
namespace MCELocationPlugin {
    /**
    Set callback for location database updates
    @param {LocationCallback} callback Callback which will be called when the database is updated.
    */
    export const setLocationUpdatedCallback = function (
        callback: LocationCallback
    ) {
        MCEPlugin.pauseResumeCallback(
            function () {
                cordova.exec(
                    callback,
                    MCEPlugin.error,
                    "MCELocationPlugin",
                    "setLocationUpdatedCallback",
                    [false]
                );
            },
            function () {
                cordova.exec(
                    callback,
                    MCEPlugin.error,
                    "MCELocationPlugin",
                    "setLocationUpdatedCallback",
                    [true]
                );
            }
        );
    };

    /**
    Ask SDK to syncronize the geofences with the server. This can only be called once every 5 minutes.
    */
    export const syncLocations = function () {
        cordova.exec(
            null,
            MCEPlugin.error,
            "MCELocationPlugin",
            "syncLocations",
            []
        );
    };

    /**
    Manually initialize location services for SDK, requires AUTO_INITIALIZE_LOCATION=FALSE
    in the co.acoustic.mobile.push.location Cordova config
    This is used to delay location services initalization until desired.
    */
    export const manualLocationInitialization = function () {
        cordova.exec(
            null,
            null,
            "MCELocationPlugin",
            "manualLocationInitialization",
            []
        );
    };

    /**
    This method reports if the App has authorization to use location services.
    It can report the following values:
    -2 The App has foreground only access to location services (use manualLocationInitialization)
    -1 The App is not authorized to use location services
    0 The App has not yet requested to use location services (use manualLocationInitialization)
    1 The App has complete access to location services
    */
    export const locationAuthorization = function (
        callback: LocationAuthorizationCallback
    ) {
        cordova.exec(
            callback,
            null,
            "MCELocationPlugin",
            "locationAuthorization",
            []
        );
    };

    /**
This callback is called when access to the location services changes.
 */
    export const setLocationAuthorizationCallback = function (
        callback: LocationAuthorizationCallback
    ) {
        cordova.exec(
            callback,
            null,
            "MCELocationPlugin",
            "setLocationAuthorizationCallback",
            []
        );
    };
}

export = MCELocationPlugin;
