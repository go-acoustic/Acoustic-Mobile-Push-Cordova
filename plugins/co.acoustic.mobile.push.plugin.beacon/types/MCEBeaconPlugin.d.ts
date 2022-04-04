import { BeaconCallback, BeaconEnabledCallback, BeaconRegionsCallback, BeaconUUIDCallback } from "./MCEBeaconPluginTypes";
/**
Acoustic MCE iBeacon Cordova Plugin
@module
*/
declare namespace MCEBeaconPlugin {
    /**
    Query the current iBeacon regions.
    @param {BeaconRegionsCallback} callback The callback with the current iBeacon regions.
    */
    const beaconRegions: (callback: BeaconRegionsCallback) => void;
    /**
    Set callback for entering iBeacon regions
    @param {BeaconCallback} callback Callback function for entering iBeacon regions.
    */
    const setBeaconEnterCallback: (callback: BeaconCallback) => void;
    /**
    Set callback for exiting iBeacon regions
    @param {BeaconCallback} callback Callback function for exiting iBeacon regions.
    */
    const setBeaconExitCallback: (callback: BeaconCallback) => void;
    /**
    Query if iBeacons are enabled or disabled
    @param {BeaconEnabledCallback} callback response callback.
    */
    const beaconEnabled: (callback: BeaconEnabledCallback) => void;
    /**
    Query if iBeacon global UUID currently setup.
    @param {BeaconUUIDCallback} callback response callback.
    */
    const beaconUUID: (callback: BeaconUUIDCallback) => void;
}
export = MCEBeaconPlugin;
