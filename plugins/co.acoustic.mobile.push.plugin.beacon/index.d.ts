import MCEBeaconPluginNS from "./types/MCEBeaconPlugin";
import MCEBeaconPluginTypes from './types/MCEBeaconPluginTypes';

declare global {
    var MCEBeaconPlugin: typeof MCEBeaconPluginNS;
}

export = MCEBeaconPluginTypes;
