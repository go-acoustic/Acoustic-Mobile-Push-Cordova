import MCEInAppPluginNS from "./types/MCELocationPlugin";
import MCEInAppPluginTypes from "./types/MCELocationPluginTypes";

declare global {
    var MCEInAppPlugin: typeof MCEInAppPluginNS;
}

export = MCEInAppPluginTypes;
