/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AcousticService } from './acoustic/acoustic.service';

@Component({
    selector: 'app-root',
    imports: [IonApp, IonRouterOutlet],
    template: `<ion-app><ion-router-outlet /></ion-app>`,
})
export class App implements OnInit {
    private readonly acoustic = inject(AcousticService);
    private readonly router = inject(Router);

    async ngOnInit() {
        // Campaign "Simple + Inbox": a push whose action is `openInboxMessage`. On Android the SDK opens the message
        // itself; on iOS it only runs an action the app has registered, so without this a tap on the notification
        // opens the app and nothing else. The SDK reports the `inboxMessageOpened` event itself.
        if (Capacitor.getPlatform() === 'ios' && (await this.acoustic.ready)) {
            await this.acoustic.api.setRegisteredActionCallback(
                'openInboxMessage',
                this.acoustic.inZone((action) => void this.openInboxMessage(action))
            );
        }
    }

    private async openInboxMessage(action: { [key: string]: any }) {
        const api = this.acoustic.api;
        try {
            const message = await api.fetchInboxMessageViaRichContentId(String(action['value']));
            await this.router.navigate(['/inbox', message.inboxMessageId]);
        } catch (error) {
            console.error('openInboxMessage failed', error);
        }
    }
}
