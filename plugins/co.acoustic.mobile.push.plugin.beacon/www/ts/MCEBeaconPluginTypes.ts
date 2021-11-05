export interface BeaconMajor {
    /** Major of beacon region */
    major: number;
}

/**
@callback BeaconRegionsCallback
@param {Array.<BeaconMajor>} beacons List of current beacon regions.
*/
export type BeaconRegionsCallback = (beacons: BeaconMajor[]) => void;

export interface Beacon {
    /** Major of beacon region */
    major: number;
    /** Minor of beacon region */
    minor: number;
    /** Identifier of beacon region */
    locationId: string;
}

/**
@callback BeaconCallback
@param {Beacon} beacon Beacon region entered or left.
*/
export type BeaconCallback = (beacon: Beacon) => void;


    /**
@callback BeaconEnabledCallback
@param {boolean} status True if iBeacons are enabled, false otherwise.
*/
export type BeaconEnabledCallback = (status: boolean) => void;

/**
@callback BeaconUUIDCallback
@param {string} status iBeacon global UUID setup.
*/
export type BeaconUUIDCallback = (status: string) => void;
