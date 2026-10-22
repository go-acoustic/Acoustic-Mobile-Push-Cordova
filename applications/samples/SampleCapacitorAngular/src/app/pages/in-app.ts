/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { Component, inject } from '@angular/core';
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
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';
import { AcousticService } from '../acoustic/acoustic.service';
import { InAppMessage } from '../acoustic/acoustic-campaign';

const LOREM =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque rhoncus, eros sed imperdiet finibus, purus nibh ' +
    'placerat leo, non fringilla massa tortor in tellus. Donec aliquet pharetra dui ac tincidunt. Ut eu mi at ligula ' +
    'varius suscipit. Vivamus quis quam nec urna sollicitudin egestas eu at elit.';

@Component({
    selector: 'app-in-app',
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
        IonTitle,
        IonToolbar,
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start"><ion-back-button defaultHref="/" text="Sample" /></ion-buttons>
                <ion-title>In App</ion-title>
                <ion-buttons slot="end">
                    <ion-button (click)="sync()"><ion-icon slot="icon-only" name="refresh-outline" /></ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list>
                <ion-list-header>Execute InApp Actions</ion-list-header>
                <ion-item button (click)="execute(['topBanner'])"><ion-label>Top Banner Template</ion-label></ion-item>
                <ion-item button (click)="execute(['bottomBanner'])"><ion-label>Bottom Banner Template</ion-label></ion-item>
                <ion-item button (click)="execute(['image'])"><ion-label>Image Template</ion-label></ion-item>
                <ion-item button (click)="execute(['video'])"><ion-label>Video Template</ion-label></ion-item>
                <ion-item button (click)="execute(['all'])"><ion-label>Next Queued InApp</ion-label></ion-item>
            </ion-list>
            <ion-list>
                <ion-list-header>Add Canned InApp</ion-list-header>
                <ion-item button (click)="addBanner('topBanner', 'top')"><ion-label>Top Banner Template</ion-label></ion-item>
                <ion-item button (click)="addBanner('bottomBanner')"><ion-label>Bottom Banner Template</ion-label></ion-item>
                <ion-item button (click)="addMedia('image')"><ion-label>Image Template</ion-label></ion-item>
                <ion-item button (click)="addMedia('video')"><ion-label>Video Template</ion-label></ion-item>
            </ion-list>
        </ion-content>
    `,
})
export class InAppPage {
    private readonly acoustic = inject(AcousticService);

    constructor() {
        addIcons({ refreshOutline });
    }

    protected sync() {
        this.acoustic.api.syncInAppMessages();
    }

    protected execute(rules: string[]) {
        this.acoustic.api.executeInAppRule(rules);
    }

    protected addBanner(rule: string, orientation?: string) {
        this.add(rule, 'default', {
            ...(orientation ? { orientation } : {}),
            action: { type: 'url', value: 'https://acoustic.co' },
            text: 'Canned Banner Template Text',
            icon: 'note',
            color: '0077FF',
        });
    }

    protected addMedia(template: 'image' | 'video') {
        this.add(template, template, {
            action: { type: 'url', value: 'https://acoustic.co' },
            title: `Canned ${template === 'image' ? 'Image' : 'Video'} Template Title`,
            text: LOREM,
            ...(template === 'image'
                ? { image: 'https://picsum.photos/200/300' }
                : { video: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4' }),
        });
    }

    /** A message that can be shown now (trigger date a day ago, valid for a day), shown up to five times. */
    private add(rule: string, template: string, content: InAppMessage['content']) {
        const day = 24 * 60 * 60 * 1000;
        this.acoustic.api.addInAppMessage({
            inAppMessageId: crypto.randomUUID(),
            rules: [rule, 'all'],
            maxViews: 5,
            template,
            content,
            triggerDate: new Date(Date.now() - day).toISOString(),
            expirationDate: new Date(Date.now() + day).toISOString(),
        });
    }
}
