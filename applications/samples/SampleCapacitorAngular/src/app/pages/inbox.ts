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
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';
import { AcousticService } from '../acoustic/acoustic.service';
import { InboxMessage } from '../acoustic/acoustic-campaign';
import { inboxPreview, inboxSubject } from '../acoustic/inbox-template';

@Component({
    selector: 'app-inbox',
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
        IonTitle,
        IonToolbar,
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start"><ion-back-button defaultHref="/" text="Sample" /></ion-buttons>
                <ion-title>Inbox</ion-title>
                <ion-buttons slot="end">
                    <ion-button (click)="refresh()"><ion-icon slot="icon-only" name="refresh-outline" /></ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            @if (messages().length === 0) {
                <div class="emptyInbox">{{ empty() }}</div>
            }
            <ion-list>
                @for (message of messages(); track message.inboxMessageId) {
                    <ion-item button detail (click)="open(message)">
                        <ion-label>
                            <h2 [style.font-weight]="message.isRead ? 'normal' : 'bold'">{{ subject(message) }}</h2>
                            <p>{{ preview(message) }}</p>
                        </ion-label>
                        <span slot="end" class="inbox-date">{{ date(message) }}</span>
                    </ion-item>
                }
            </ion-list>
        </ion-content>
    `,
})
export class InboxPage implements OnInit {
    private readonly acoustic = inject(AcousticService);
    private readonly nav = inject(NavController);
    protected readonly messages = signal<InboxMessage[]>([]);
    protected readonly empty = signal('Inbox is not yet available.');

    constructor() {
        addIcons({ refreshOutline });
    }

    async ngOnInit() {
        if (!(await this.acoustic.ready) || !this.acoustic.has('MCEInboxPlugin')) {
            return;
        }
        await this.acoustic.api.setInboxMessagesUpdateCallback(
            this.acoustic.inZone((messages) => {
                this.messages.set(messages.filter((m) => !m.isDeleted));
                this.empty.set('Inbox has no messages.');
            })
        );
        await this.acoustic.api.syncInboxMessages();
        // The plugin reports the list only when it changes, and skips a sync that comes too soon after the last one
        setTimeout(() => this.empty.set('Inbox has no messages.'), 3000);
    }

    protected refresh() {
        this.acoustic.api.syncInboxMessages();
    }

    protected open(message: InboxMessage) {
        this.nav.navigateForward(['/inbox', message.inboxMessageId]);
    }

    protected subject(message: InboxMessage): string {
        return inboxSubject(message);
    }

    protected preview(message: InboxMessage): string {
        return inboxPreview(message);
    }

    protected date(message: InboxMessage): string {
        return message.sendDate ? new Date(message.sendDate).toLocaleDateString() : '';
    }
}
