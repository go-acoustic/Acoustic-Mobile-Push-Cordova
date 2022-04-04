import { GeofenceCallback, GeofenceEnabledCallback, GeofencesNearCallback } from "./MCEGeofencePluginTypes";
/**
Acoustic MCE Geofence Cordova Plugin
*/
declare namespace MCEGeofencePlugin {
    /**
    Get geofences nearby provided latitude and longitude
    @param {GeofencesNearCallback} callback Callback data will be provided to
    @param {double} latitude Latitude of center of area
    @param {double} longitude Longitude of center of area
    @param {double} radius Radius of area
    */
    const geofencesNear: (callback: GeofencesNearCallback, latitude: number, longitude: number, radius: number) => void;
    /**
    Set callback for entering geofences
    @param {GeofenceCallback} callback Callback executed when geofences are entered.
    */
    const setGeofenceEnterCallback: (callback: GeofenceCallback) => void;
    /**
    Set callback for exiting geofences
    @param {GeofenceCallback} callback Callback executed when geofences are exited.
    */
    const setGeofenceExitCallback: (callback: GeofenceCallback) => void;
    /**
    Query if geofences are enabled or disabled
    @param {GeofenceEnabledCallback} callback response callback.
    */
    const geofenceEnabled: (callback: GeofenceEnabledCallback) => void;
}
export = MCEGeofencePlugin;
