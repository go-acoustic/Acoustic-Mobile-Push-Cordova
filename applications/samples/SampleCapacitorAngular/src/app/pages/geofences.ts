/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';
import { AcousticService } from '../acoustic/acoustic.service';
import { Geofence } from '../acoustic/acoustic-campaign';
import { loadGoogleMaps } from '../acoustic/google-maps';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from '../maps.config';

@Component({
    selector: 'app-geofences',
    imports: [
        IonBackButton,
        IonButton,
        IonButtons,
        IonContent,
        IonHeader,
        IonIcon,
        IonItem,
        IonLabel,
        IonList,
        IonListHeader,
        IonNote,
        IonTitle,
        IonToolbar,
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start"><ion-back-button defaultHref="/" text="Sample" /></ion-buttons>
                <ion-title>Geofences</ion-title>
                <ion-buttons slot="end">
                    <ion-button (click)="sync()"><ion-icon slot="icon-only" name="refresh-outline" /></ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list>
                <ion-item button (click)="enable()">
                    <ion-label>Status</ion-label>
                    <ion-note slot="end" [color]="statusColor()">{{ status() }}</ion-note>
                </ion-item>
            </ion-list>
            @if (mapAvailable()) {
                <div #map class="map"></div>
            } @else {
                <ion-note class="ion-padding">{{ mapMessage() }}</ion-note>
            }
            <ion-list>
                <ion-list-header>Geofences within 1 km</ion-list-header>
                @for (geofence of geofences(); track $index) {
                    <ion-item>
                        <ion-label>{{ geofence['latitude'] }}, {{ geofence['longitude'] }}</ion-label>
                        <ion-note slot="end">{{ geofence['radius'] }} m</ion-note>
                    </ion-item>
                } @empty {
                    <ion-item><ion-label>{{ empty() }}</ion-label></ion-item>
                }
            </ion-list>
        </ion-content>
    `,
})
export class GeofencesPage implements OnInit, OnDestroy {
    private readonly acoustic = inject(AcousticService);
    protected readonly status = signal('');
    protected readonly statusColor = signal('medium');
    protected readonly geofences = signal<Geofence[]>([]);
    protected readonly empty = signal('No location yet.');
    protected readonly mapAvailable = signal((GOOGLE_MAPS_API_KEY as string) !== 'YOUR_GOOGLE_MAPS_API_KEY');
    protected readonly mapMessage = signal('Set GOOGLE_MAPS_API_KEY in src/app/maps.config.ts to see the geofences on a map.');
    private readonly mapElement = viewChild<ElementRef<HTMLElement>>('map');
    private maps: any;
    private map: any;
    private deviceMarker: any;
    private circles: any[] = [];
    private watchId?: number;

    constructor() {
        addIcons({ refreshOutline });
    }

    async ngOnInit() {
        if (!(await this.acoustic.ready) || !this.acoustic.has('MCEGeofencePlugin')) {
            return;
        }
        await this.acoustic.api.setLocationAuthorizationCallback(this.acoustic.inZone(() => this.updateStatus()));
        await this.acoustic.api.setLocationUpdatedCallback(this.acoustic.inZone(() => this.updateGeofences()));
        await this.updateStatus();
        await this.updateGeofences();
    }

    protected enable() {
        this.acoustic.api.manualLocationInitialization();
    }

    protected sync() {
        this.acoustic.api.syncLocations();
        this.updateGeofences();
    }

    private async updateStatus() {
        if (!(await this.acoustic.api.geofenceEnabled())) {
            this.set('DISABLED', 'danger');
            return;
        }
        switch (await this.acoustic.api.locationAuthorization()) {
            case 0:
                this.set('DELAYED (touch to enable)', 'medium');
                break;
            case -1:
                this.set('DENIED', 'danger');
                break;
            case -2:
                this.set('FOREGROUND (touch to enable)', 'medium');
                break;
            default:
                this.set('ENABLED', 'success');
        }
    }

    /** Lists the geofences around the current position. (The other samples draw them on a Google map.) */
    private updateGeofences() {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const near = await this.acoustic.api.geofencesNear(
                    position.coords.latitude,
                    position.coords.longitude,
                    1000
                );
                this.geofences.set(near);
                this.empty.set('No geofences nearby.');
                await this.draw(position.coords.latitude, position.coords.longitude, near);
            },
            () => this.empty.set('Location is not available.')
        );
    }

    ngOnDestroy() {
        if (this.watchId !== undefined) {
            navigator.geolocation.clearWatch(this.watchId);
        }
    }

    /** Shows the device and the geofences on the map, as the other samples do. */
    private async draw(latitude: number, longitude: number, geofences: Geofence[]) {
        if (!this.mapAvailable()) {
            return;
        }
        try {
            this.maps ??= await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
            const element = this.mapElement()?.nativeElement;
            if (!element) {
                return;
            }
            const center = { lat: latitude, lng: longitude };
            if (!this.map) {
                this.map = new this.maps.Map(element, { center, zoom: 15, mapId: GOOGLE_MAPS_MAP_ID });
                this.deviceMarker = new this.maps.marker.AdvancedMarkerElement({ map: this.map, position: center });
                // Follow the device
                this.watchId = navigator.geolocation.watchPosition((p) =>
                    this.zoneUpdate(p.coords.latitude, p.coords.longitude)
                );
            } else {
                this.deviceMarker.position = center;
            }
            this.circles.forEach((circle) => circle.setMap(null));
            this.circles = geofences.map(
                (g) =>
                    new this.maps.Circle({
                        map: this.map,
                        center: { lat: g['latitude'], lng: g['longitude'] },
                        radius: g['radius'],
                        strokeColor: '#0000FF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#0000FF',
                        fillOpacity: 0.35,
                    })
            );
        } catch (error) {
            this.mapAvailable.set(false);
            this.mapMessage.set(String(error));
        }
    }

    private zoneUpdate(latitude: number, longitude: number) {
        this.acoustic.inZone(() => {
            this.deviceMarker && (this.deviceMarker.position = { lat: latitude, lng: longitude });
        })();
    }

    private set(text: string, color: string) {
        this.status.set(text);
        this.statusColor.set(color);
    }
}
