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
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AcousticService } from '../acoustic/acoustic.service';

@Component({
    selector: 'app-events',
    imports: [IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start"><ion-back-button defaultHref="/" text="Sample" /></ion-buttons>
                <ion-title>Test Events</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
            <p><b>Events</b></p>
            <ion-button expand="block" class="status-flash" [color]="color()" (click)="send()">
                Queue Notification Click Event
            </ion-button>
            <p>Click to send a test event, you should see the send status to the right of the click event.</p>
        </ion-content>
    `,
})
export class EventsPage implements OnInit {
    private readonly acoustic = inject(AcousticService);
    protected readonly color = signal('primary');

    async ngOnInit() {
        if (!(await this.acoustic.ready)) {
            return;
        }
        await this.acoustic.api.setEventQueueCallbacks(
            this.acoustic.inZone(() => this.blink('success')),
            this.acoustic.inZone(() => this.blink('danger'))
        );
    }

    protected send() {
        this.acoustic.api.queueAddEvent({
            type: 'simpleNotification',
            name: 'appOpened',
            timestamp: new Date(),
            attributes: {},
        });
    }

    private blink(color: string) {
        this.color.set(color);
        setTimeout(() => this.color.set('primary'), 1000);
    }
}
