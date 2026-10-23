/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

/**
 * Promise-based, typed access to the Acoustic Campaign Cordova plugins in a Capacitor app.
 *
 * The Cordova plugins are reached through the global objects they register (`MCEPlugin`,
 * `MCEInboxPlugin`, ...). Each plugin is optional: calling a function of a plugin that is not
 * installed rejects with an error. Nothing here talks to native code directly.
 *
 * Usage:
 *   import { AcousticCampaign } from "./acoustic-campaign";
 *   const details = await AcousticCampaign.getRegistrationDetails();
 */

export interface Registration {
    userId: string;
    channelId: string;
    /** iOS only */
    deviceToken: string;
    /** Android only */
    registrationId: string;
}

export interface RegisteredStatus {
    mobilePushRegistered: boolean;
    providerRegistered: boolean;
    providerName: "APNS" | "GCM" | "FCM";
}

export interface Insets {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

export interface CampaignEvent {
    type: string;
    name: string;
    timestamp: Date;
    attributes: any;
    attribution?: string;
}

export interface EventQueueFailure {
    events: CampaignEvent[];
    error: string;
}

export interface AttributeQueueResult {
    operation: "update" | "delete";
    domain: "channel" | "user";
    attributes: any;
    keys: string[];
    error?: string;
}

/** A push message that reached the app. Silent data pushes arrive here too. */
export interface ReceivedMessage {
    type: string;
    payload: string;
    subject?: string;
    message?: string;
    attribution?: string;
    mailingId?: string;
}

export interface InboxMessage {
    inboxMessageId: string;
    richContentId: string;
    expirationDate: number;
    sendDate: number;
    template: string;
    attribution: string;
    isRead: boolean;
    isDeleted: boolean;
    mailingId?: string;
    [key: string]: any;
}

export interface InAppMessage {
    inAppMessageId: string;
    rules: string[];
    maxViews: number;
    template: string;
    content: { [key: string]: any };
    /** ISO 8601 */
    triggerDate: string;
    /** ISO 8601 */
    expirationDate: string;
}

export interface Geofence {
    [key: string]: any;
}

export interface Beacon {
    major: number;
    minor: number;
    locationId: string;
}

export interface BeaconMajor {
    [key: string]: any;
}

/** -2 foreground only, -1 not authorized, 0 not requested, 1 full access */
export type LocationAuthorization = -2 | -1 | 0 | 1;

type Plugin = { [name: string]: (...args: any[]) => any };

function plugin(name: string): Plugin {
    const p = (globalThis as any)[name];
    if (!p) {
        throw new Error(
            name + " is not available. Install the Cordova plugin and run `npx cap sync`."
        );
    }
    return p;
}

/** Calls a plugin function whose last argument is a single-value callback. */
function ask<T>(pluginName: string, fn: string, ...args: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        try {
            plugin(pluginName)[fn](...args, (value: T) => resolve(value));
        } catch (e) {
            reject(e);
        }
    });
}

/** Calls a plugin function that takes the callback first, then other arguments. */
function askFirst<T>(pluginName: string, fn: string, ...args: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        try {
            plugin(pluginName)[fn]((value: T) => resolve(value), ...args);
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Calls a plugin function that returns nothing. The Cordova plugins do not report when such a call finishes or fails
 * (errors are only logged), so the Promise resolves when the call has been handed to the native side. It rejects when
 * the plugin is not installed or the call throws.
 */
function send(pluginName: string, fn: string, ...args: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            plugin(pluginName)[fn](...args);
            resolve();
        } catch (e) {
            reject(e);
        }
    });
}

export const AcousticCampaign = {
    // --- Core (cordova-acoustic-mobile-push) ---
    getSdkVersion: () => ask<string>("MCEPlugin", "getSdkVersion"),
    getPluginVersion: () => ask<string>("MCEPlugin", "getPluginVersion"),
    /** Swaps the light and dark variants of the images of the page. Needs jQuery, like the rest of the plugin UI. */
    replaceImages: () => send("MCEPlugin", "replaceImages"),
    getRegistrationDetails: () => ask<Registration>("MCEPlugin", "getRegistrationDetails"),
    getAppKey: () => ask<string>("MCEPlugin", "getAppKey"),
    getBadge: () => ask<number>("MCEPlugin", "getBadge"),
    safeAreaInsets: () => ask<Insets>("MCEPlugin", "safeAreaInsets"),
    userInvalidated: () => ask<boolean>("MCEPlugin", "userInvalidated"),

    /** The plugin calls back with three positional values. */
    isRegistered: () =>
        new Promise<RegisteredStatus>((resolve, reject) => {
            try {
                plugin("MCEPlugin")["isRegistered"](
                    (mobilePushRegistered: boolean, providerRegistered: boolean, providerName: any) =>
                        resolve({ mobilePushRegistered, providerRegistered, providerName })
                );
            } catch (e) {
                reject(e);
            }
        }),

    setBadge: (badge: number) => send("MCEPlugin", "setBadge", badge),
    phoneHome: () => send("MCEPlugin", "phoneHome"),
    manualInitialization: () => send("MCEPlugin", "manualInitialization"),
    queueAddEvent: (event: CampaignEvent, flush?: boolean) =>
        send("MCEPlugin", "queueAddEvent", event, flush),
    queueUpdateUserAttributes: (attributes: { [key: string]: any }) =>
        send("MCEPlugin", "queueUpdateUserAttributes", attributes),
    queueDeleteUserAttributes: (keys: string[]) =>
        send("MCEPlugin", "queueDeleteUserAttributes", keys),

    // Listeners stay callbacks: they can fire many times.
    setRegistrationCallback: (cb: (registration: Registration) => void) =>
        send("MCEPlugin", "setRegistrationCallback", cb),
    /**
     * Registers a handler for a custom action type. Note the argument order: the Cordova plugin takes
     * (callback, type); this wrapper takes (type, callback), like the other calls that name a type first.
     */
    setRegisteredActionCallback: (
        type: string,
        cb: (actionPayload: { [key: string]: any }, payload: { [key: string]: any }) => void
    ) => send("MCEPlugin", "setRegisteredActionCallback", cb, type),
    setActionNotRegisteredCallback: (cb: (action: string) => void) =>
        send("MCEPlugin", "setActionNotRegisteredCallback", cb),
    setActionNotYetRegisteredCallback: (cb: (action: string) => void) =>
        send("MCEPlugin", "setActionNotYetRegisteredCallback", cb),
    unregisterActionCallback: (type: string) => send("MCEPlugin", "unregisterActionCallback", type),
    setEventQueueCallbacks: (
        onSuccess: (events: CampaignEvent[]) => void,
        onFailure: (failure: EventQueueFailure) => void
    ) => send("MCEPlugin", "setEventQueueCallbacks", onSuccess, onFailure),
    setAttributeQueueCallbacks: (
        onSuccess: (result: AttributeQueueResult) => void,
        onFailure: (result: AttributeQueueResult) => void
    ) => send("MCEPlugin", "setAttributeQueueCallbacks", onSuccess, onFailure),
    setMessageReceivedCallback: (cb: (message: ReceivedMessage) => void) =>
        send("MCEPlugin", "setMessageReceivedCallback", cb),

    // --- Inbox (cordova-acoustic-mobile-push-plugin-inbox) ---
    syncInboxMessages: () => send("MCEInboxPlugin", "syncInboxMessages"),
    fetchInboxMessageId: (inboxMessageId: string) =>
        ask<InboxMessage>("MCEInboxPlugin", "fetchInboxMessageId", inboxMessageId),
    fetchInboxMessageViaRichContentId: (richContentId: string) =>
        ask<InboxMessage>("MCEInboxPlugin", "fetchInboxMessageViaRichContentId", richContentId),
    readInboxMessage: (inboxMessageId: string) =>
        send("MCEInboxPlugin", "readMessageId", inboxMessageId),
    deleteInboxMessage: (inboxMessageId: string) =>
        send("MCEInboxPlugin", "deleteMessageId", inboxMessageId),
    clearExpiredInboxMessages: () => send("MCEInboxPlugin", "clearExpiredMessages"),
    /**
     * Runs an action of an inbox message, for example `{ type: "url", value: "https://..." }` from the `actions`
     * of the message. The SDK performs the action and reports the click event. An app that draws the message
     * itself calls this when the user taps an action link.
     */
    executeInboxAction: (action: { [key: string]: any }, inboxMessageId: string) =>
        send("MCEInboxPlugin", "executeInboxAction", action, inboxMessageId),
    setInboxMessagesUpdateCallback: (cb: (messages: InboxMessage[]) => void) =>
        send("MCEInboxPlugin", "setInboxMessagesUpdateCallback", cb),

    // --- In-app (cordova-acoustic-mobile-push-plugin-inapp) ---
    syncInAppMessages: () => ask<void>("MCEInAppPlugin", "syncInAppMessages"),
    /** Shows the first stored in-app message that matches one of the rules, for example ["image"] or ["all"]. */
    executeInAppRule: (rules: string[]) => send("MCEInAppPlugin", "executeInAppRule", rules),
    /** Stores an in-app message locally. Useful for testing a template without sending one from Campaign. */
    addInAppMessage: (message: InAppMessage) => send("MCEInAppPlugin", "addInAppMessage", message),

    // --- Location (cordova-acoustic-mobile-push-plugin-location) ---
    locationAuthorization: () =>
        ask<LocationAuthorization>("MCELocationPlugin", "locationAuthorization"),
    syncLocations: () => send("MCELocationPlugin", "syncLocations"),
    manualLocationInitialization: () => send("MCELocationPlugin", "manualLocationInitialization"),
    setLocationAuthorizationCallback: (cb: (level: LocationAuthorization) => void) =>
        send("MCELocationPlugin", "setLocationAuthorizationCallback", cb),
    setLocationUpdatedCallback: (cb: () => void) => send("MCELocationPlugin", "setLocationUpdatedCallback", cb),

    // --- Geofence (cordova-acoustic-mobile-push-plugin-geofence) ---
    geofenceEnabled: () => ask<boolean>("MCEGeofencePlugin", "geofenceEnabled"),
    geofencesNear: (latitude: number, longitude: number, radius: number) =>
        askFirst<Geofence[]>("MCEGeofencePlugin", "geofencesNear", latitude, longitude, radius),
    setGeofenceEnterCallback: (cb: (geofence: Geofence) => void) =>
        send("MCEGeofencePlugin", "setGeofenceEnterCallback", cb),
    setGeofenceExitCallback: (cb: (geofence: Geofence) => void) =>
        send("MCEGeofencePlugin", "setGeofenceExitCallback", cb),

    // --- Beacon (cordova-acoustic-mobile-push-plugin-beacon) ---
    beaconEnabled: () => ask<boolean>("MCEBeaconPlugin", "beaconEnabled"),
    beaconUUID: () => ask<string>("MCEBeaconPlugin", "beaconUUID"),
    beaconRegions: () => ask<BeaconMajor[]>("MCEBeaconPlugin", "beaconRegions"),
    setBeaconEnterCallback: (cb: (beacon: Beacon) => void) =>
        send("MCEBeaconPlugin", "setBeaconEnterCallback", cb),
    setBeaconExitCallback: (cb: (beacon: Beacon) => void) =>
        send("MCEBeaconPlugin", "setBeaconExitCallback", cb),
};
