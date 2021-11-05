import MCEInboxNS from "./types/MCEInbox";
import MCEInboxPluginNS from "./types/MCEInboxPlugin";
import MCEInboxTypes from "./types/MCEInboxPluginTypes";

declare global {
    var MCEInboxPlugin: typeof MCEInboxPluginNS;
    var MCEInbox: typeof MCEInboxNS;
}

export = MCEInboxTypes;
