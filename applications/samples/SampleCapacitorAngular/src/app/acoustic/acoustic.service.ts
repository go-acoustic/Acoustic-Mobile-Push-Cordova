/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { Injectable, NgZone, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AcousticCampaign } from './acoustic-campaign';

/**
 * Angular access to the Acoustic Campaign Cordova plugins.
 *
 * Capacitor exposes each Cordova plugin as a global (MCEPlugin, MCEInboxPlugin, ...) once its
 * runtime has loaded. Plugin callbacks arrive from native code outside Angular's zone, so listeners
 * are wrapped with `inZone` to get change detection.
 */
@Injectable({ providedIn: 'root' })
export class AcousticService {
    private readonly zone = inject(NgZone);

    /** The typed, Promise-based plugin API. */
    readonly api = AcousticCampaign;

    /** Resolves true when the plugins are available, false when they are not (for example in a browser). */
    readonly ready: Promise<boolean> = new Promise<boolean>((resolve) => {
        const started = Date.now();
        const check = () => {
            if (this.has('MCEPlugin')) {
                resolve(true);
            } else if (Date.now() - started > 3000) {
                resolve(false);
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });

    /** True when the global of an optional plugin exists, for example `MCEInAppPlugin`. */
    has(plugin: string): boolean {
        return typeof (window as any)[plugin] !== 'undefined';
    }

    /**
     * Asks for the permission to show notifications. Android 13 and later need it at runtime, and the Acoustic
     * plugins only declare it. iOS asks when the Acoustic SDK registers for push, so it is left alone here.
     * @returns true when notifications are allowed
     */
    async requestNotificationPermission(): Promise<boolean> {
        if (Capacitor.getPlatform() !== 'android') {
            return true;
        }
        let { display } = await LocalNotifications.checkPermissions();
        if (display === 'prompt' || display === 'prompt-with-rationale') {
            ({ display } = await LocalNotifications.requestPermissions());
        }
        return display === 'granted';
    }

    /** Runs a plugin callback inside the Angular zone. */
    inZone<A extends unknown[]>(callback: (...args: A) => void): (...args: A) => void {
        return (...args: A) => this.zone.run(() => callback(...args));
    }
}
