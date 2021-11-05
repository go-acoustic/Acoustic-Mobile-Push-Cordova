import MCEGeofencePluginNS from "./types/MCEGeofencePlugin";
import MCEGeofencePluginTypes from './types/MCEGeofencePluginTypes';

declare global {
    var MCEGeofencePlugin: typeof MCEGeofencePluginNS;
}

export = MCEGeofencePluginTypes;
