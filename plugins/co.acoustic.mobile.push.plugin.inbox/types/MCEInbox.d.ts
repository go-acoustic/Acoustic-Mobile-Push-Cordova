import { InboxMessage, InboxRegistry } from "./MCEInboxPluginTypes";
declare namespace MCEInbox {
    const setInboxRegistry: (name: string, handlers: InboxRegistry) => void;
    const inboxMessageOpened: (inboxMessage: InboxMessage) => void;
    const findMessageIndex: (inboxMessageId: string) => number;
}
export = MCEInbox;
