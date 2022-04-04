import { LocationAuthorizationCallback, LocationCallback } from "./MCELocationPluginTypes";
/**
Acoustic MCE Location Cordova Plugin
*/
declare namespace MCELocationPlugin {
    /**
    Set callback for location database updates
    @param {LocationCallback} callback Callback which will be called when the database is updated.
    */
    const setLocationUpdatedCallback: (callback: LocationCallback) => void;
    /**
    Ask SDK to syncronize the geofences with the server. This can only be called once every 5 minutes.
    */
    const syncLocations: () => void;
    /**
    Manually initialize location services for SDK, requires AUTO_INITIALIZE_LOCATION=FALSE
    in the co.acoustic.mobile.push.location Cordova config
    This is used to delay location services initalization until desired.
    */
    const manualLocationInitialization: () => void;
    /**
    This method reports if the App has authorization to use location services.
    It can report the following values:
    -2 The App has foreground only access to location services (use manualLocationInitialization)
    -1 The App is not authorized to use location services
    0 The App has not yet requested to use location services (use manualLocationInitialization)
    1 The App has complete access to location services
    */
    const locationAuthorization: (callback: LocationAuthorizationCallback) => void;
    /**
This callback is called when access to the location services changes.
 */
    const setLocationAuthorizationCallback: (callback: LocationAuthorizationCallback) => void;
}
export = MCELocationPlugin;
