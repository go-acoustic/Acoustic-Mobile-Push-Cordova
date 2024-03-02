export interface Geofence {
    /** Latitude of center of geofence. */
    latitude: number;
    /** Longitude of center of geofence. */
    longitude: number;
    /** Radius of geofence in meters. */
    radius: number;
    /** Unique location identifier. */
    locationId: string;
}

/**
@callback GeofencesNearCallback
@param geofences {Array.<Geofence>} List of geofences
 */
export type GeofencesNearCallback = (geofences: Geofence[]) => void;

/**
@callback GeofenceCallback
@param geofence {Geofence} Geofence entered or exited.
 */
export type GeofenceCallback = (geofence: Geofence) => void;

/**
@callback GeofenceEnabledCallback
@param {boolean} status True if geofences are enabled, false otherwise.
*/
export type GeofenceEnabledCallback = (status: boolean) => void;
