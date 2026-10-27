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
    IonInput,
    IonText,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { AcousticService } from '../acoustic/acoustic.service';

@Component({
    selector: 'app-custom-actions',
    imports: [IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonText, IonTitle, IonToolbar],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start"><ion-back-button defaultHref="/" text="Sample" /></ion-buttons>
                <ion-title>Custom Actions</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
            <ion-input
                label="Custom Action Type"
                labelPlacement="stacked"
                fill="outline"
                [value]="type()"
                (ionInput)="setType($any($event).detail.value)"
            />
            <ion-button expand="block" class="ion-margin-top" (click)="register()">
                Register Custom Action with Type
            </ion-button>
            <ion-button expand="block" (click)="unregister()">Unregister Custom Action with Type</ion-button>
            <p><b>Status</b></p>
            <ion-text [color]="statusColor()">{{ status() }}</ion-text>
        </ion-content>
    `,
})
export class CustomActionsPage implements OnInit {
    private readonly acoustic = inject(AcousticService);
    protected readonly type = signal(localStorage.getItem('customActionType') ?? 'custom');
    protected readonly status = signal('No status yet');
    protected readonly statusColor = signal('medium');

    async ngOnInit() {
        if (!(await this.acoustic.ready)) {
            return;
        }
        const api = this.acoustic.api;
        await api.setActionNotRegisteredCallback(
            this.acoustic.inZone((action) => this.show('danger', `Unregistered Custom Action Received: ${action}`))
        );
        await api.setActionNotYetRegisteredCallback(
            this.acoustic.inZone((action) => this.show('warning', `Previously Registered Custom Action Received: ${action}`))
        );
    }

    protected setType(value: string) {
        this.type.set(value);
        localStorage.setItem('customActionType', value);
    }

    protected async register() {
        const type = this.type();
        await this.acoustic.api.setRegisteredActionCallback(
            type,
            this.acoustic.inZone(() => this.show('success', `Received push for action type: ${type}`))
        );
        this.show('success', `Registered handler for action type: ${type}`);
    }

    protected async unregister() {
        await this.acoustic.api.unregisterActionCallback(this.type());
        this.show('success', `Unregistered handler for action type: ${this.type()}`);
    }

    private show(color: string, text: string) {
        this.statusColor.set(color);
        this.status.set(text);
    }
}
