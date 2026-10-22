/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

declare const google: any;

let loading: Promise<any> | undefined;

/** Loads the Google Maps JavaScript API once and resolves with the `google.maps` namespace. */
export function loadGoogleMaps(apiKey: string): Promise<any> {
    if ((window as any).google?.maps?.Map) {
        return Promise.resolve(google.maps);
    }
    loading ??= new Promise((resolve, reject) => {
        (window as any).__googleMapsReady = () => resolve(google.maps);
        const script = document.createElement('script');
        script.src =
            'https://maps.googleapis.com/maps/api/js?v=weekly&libraries=marker&loading=async' +
            `&key=${encodeURIComponent(apiKey)}&callback=__googleMapsReady`;
        script.async = true;
        script.onerror = () => {
            loading = undefined;
            reject(new Error('The Google Maps JavaScript API could not be loaded.'));
        };
        document.head.append(script);
    });
    return loading;
}
