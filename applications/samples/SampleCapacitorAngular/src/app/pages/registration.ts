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
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { AcousticService } from '../acoustic/acoustic.service';
import { Registration } from '../acoustic/acoustic-campaign';

@Component({
    selector: 'app-registration',
    imports: [
        IonBackButton,
        IonButton,
        IonButtons,
        IonContent,
        IonHeader,
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
                <ion-title>Registration Details</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list>
                <ion-list-header>Credentials</ion-list-header>
                <ion-item>
                    <ion-label>User Id</ion-label>
                    <ion-note slot="end">{{ userId() }}</ion-note>
                </ion-item>
                <ion-item>
                    <ion-label>Channel Id</ion-label>
                    <ion-note slot="end">{{ channelId() }}</ion-note>
                </ion-item>
                <ion-item>
                    <ion-label>App Key</ion-label>
                    <ion-note slot="end">{{ appKey() }}</ion-note>
                </ion-item>
            </ion-list>
            <div class="ion-padding">
                <ion-button expand="block" (click)="register()">{{ status() }}</ion-button>
                @if (placeholderKey()) {
                    <p>
                        <ion-note color="danger">
                            The app key is still a placeholder, so this app cannot register. Run capacitorSetup.js with
                            your app keys (see README.md).
                        </ion-note>
                    </p>
                }
                <p>
                    <ion-note>
                        User ID and Channel ID only known after registration. The registration process could take
                        several minutes, If you have issues with registering a device make sure you have the correct
                        certificate and appKey
                    </ion-note>
                </p>
            </div>
        </ion-content>
    `,
})
export class RegistrationPage implements OnInit {
    private readonly acoustic = inject(AcousticService);
    protected readonly userId = signal('');
    protected readonly channelId = signal('');
    protected readonly appKey = signal('');
    protected readonly placeholderKey = signal(false);
    protected readonly status = signal('Undefined');
    private registered = false;

    async ngOnInit() {
        if (!(await this.acoustic.ready)) {
            this.status.set('Plugins not available');
            return;
        }
        const api = this.acoustic.api;
        await api.setRegistrationCallback(this.acoustic.inZone((details) => this.update(details)));
        this.update(await api.getRegistrationDetails());
        const appKey = await api.getAppKey();
        this.appKey.set(appKey);
        this.placeholderKey.set(appKey.startsWith('YOUR_'));
    }

    protected async register() {
        if (!this.registered) {
            this.status.set('Registering');
            await this.acoustic.api.manualInitialization();
        }
    }

    private async update(details: Partial<Registration>) {
        this.registered = !!(details.userId && details.channelId);
        this.userId.set(this.registered ? details.userId! : 'not registered');
        this.channelId.set(this.registered ? details.channelId! : 'not registered');
        let status = this.registered ? 'Registered' : 'Click to register';
        if (await this.acoustic.api.userInvalidated()) {
            status += ' (Invalidated State)';
        }
        this.status.set(status);
    }
}
