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
export declare type GeofencesNearCallback = (geofences: Geofence[]) => void;
/**
@callback GeofenceCallback
@param geofence {Geofence} Geofence entered or exited.
 */
export declare type GeofenceCallback = (geofence: Geofence) => void;
/**
@callback GeofenceEnabledCallback
@param {boolean} status True if geofences are enabled, false otherwise.
*/
export declare type GeofenceEnabledCallback = (status: boolean) => void;
