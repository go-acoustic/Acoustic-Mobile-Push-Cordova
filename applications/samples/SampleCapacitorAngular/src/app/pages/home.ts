/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import {
    IonContent,
    IonFooter,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    NavController,
} from '@ionic/angular/standalone';
import { AcousticService } from '../acoustic/acoustic.service';

@Component({
    selector: 'app-home',
    imports: [IonContent, IonFooter, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
    template: `
        <ion-header>
            <ion-toolbar><ion-title>Sample App</ion-title></ion-toolbar>
        </ion-header>
        <ion-content>
            <div class="intro">
                <img src="css/images/logo.png" height="32" />
                <img src="css/images/campaign.png" height="32" />
                <h4>Acoustic Campaign Mobile Push Sample App</h4>
                <div>Plugin Version: {{ pluginVersion() }}</div>
                <div>Native SDK Version: {{ sdkVersion() }}</div>
            </div>
            <ion-list>
                <ion-item button detail (click)="open('/registration')"><ion-label>Registration Details</ion-label></ion-item>
                @if (acoustic.has('MCEInboxPlugin')) {
                    <ion-item button detail (click)="open('/inbox')"><ion-label>Inbox</ion-label></ion-item>
                }
                @if (acoustic.has('MCEInAppPlugin')) {
                    <ion-item button detail (click)="open('/in-app')"><ion-label>In App</ion-label></ion-item>
                }
                <ion-item button detail (click)="open('/custom-actions')"><ion-label>Custom Actions</ion-label></ion-item>
                <ion-item button detail (click)="open('/events')"><ion-label>Send Test Events</ion-label></ion-item>
                <ion-item button detail (click)="open('/attributes')"><ion-label>Send User Attributes</ion-label></ion-item>
                @if (acoustic.has('MCEGeofencePlugin') && acoustic.has('MCELocationPlugin')) {
                    <ion-item button detail (click)="open('/geofences')"><ion-label>View Geofences</ion-label></ion-item>
                }
            </ion-list>
        </ion-content>
        <ion-footer>
            <ion-toolbar>
                <ion-title size="small">Copyright (C) 2026 Acoustic. All rights reserved.</ion-title>
            </ion-toolbar>
        </ion-footer>
    `,
})
export class HomePage implements OnInit {
    protected readonly acoustic = inject(AcousticService);
    private readonly nav = inject(NavController);
    protected readonly pluginVersion = signal('');
    protected readonly sdkVersion = signal('');

    async ngOnInit() {
        if (!(await this.acoustic.ready)) {
            this.sdkVersion.set('plugins not available (run the app on a device or simulator)');
            return;
        }
        // Without this permission Android 13 and later receive the push but do not show it
        await this.acoustic.requestNotificationPermission();
        this.pluginVersion.set(await this.acoustic.api.getPluginVersion());
        this.sdkVersion.set(await this.acoustic.api.getSdkVersion());
        // Swap the light and dark variants of the images, as the other samples do
        this.acoustic.api.replaceImages();
    }

    protected open(url: string) {
        this.nav.navigateForward(url);
    }
}
