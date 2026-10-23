/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { Component, OnInit, inject, input, signal } from '@angular/core';
import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { AcousticService } from '../acoustic/acoustic.service';
import { InboxMessage } from '../acoustic/acoustic-campaign';

@Component({
    selector: 'app-inbox-message',
    imports: [IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start"><ion-back-button defaultHref="/inbox" text="Inbox" /></ion-buttons>
                <ion-title>{{ title() }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button (click)="delete()"><ion-icon slot="icon-only" name="trash-outline" /></ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content [scrollY]="false">
            <iframe
                sandbox="allow-same-origin"
                [srcdoc]="html()"
                (load)="bindActions($event)"
                style="border: 0; width: 100%; height: 100%"
            ></iframe>
        </ion-content>
    `,
})
export class InboxMessagePage implements OnInit {
    private readonly acoustic = inject(AcousticService);
    private readonly nav = inject(NavController);
    /** Bound from the route parameter `:id`. */
    readonly id = input.required<string>();
    protected readonly html = signal('');
    protected readonly title = signal('');
    private message?: InboxMessage;

    constructor() {
        addIcons({ trashOutline });
    }

    async ngOnInit() {
        if (!(await this.acoustic.ready)) {
            return;
        }
        const api = this.acoustic.api;
        this.message = await api.fetchInboxMessageId(this.id());
        this.title.set(this.message['content']?.messagePreview?.subject ?? '');
        this.html.set(this.message['content']?.messageDetails?.richContent ?? '');
        await api.readInboxMessage(this.id());
        await api.queueAddEvent({
            type: 'inbox',
            name: 'messageOpened',
            timestamp: new Date(),
            attributes: {
                richContentId: this.message.richContentId,
                inboxMessageId: this.message.inboxMessageId,
                attribution: this.message.attribution,
                mailingId: this.message.mailingId,
            },
        });
    }

    /**
     * The message is drawn in a sandboxed iframe, so scripts of the message cannot run. The default Inbox screen
     * of the plugin listens for taps on the action links with jQuery; this page does the same from the outside:
     * the iframe has the origin of the app (`allow-same-origin`), so a click listener on its document is allowed.
     */
    protected bindActions(event: Event) {
        const frame = event.target as HTMLIFrameElement;
        frame.contentDocument?.addEventListener('click', (click) => void this.runAction(click));
    }

    private async runAction(click: Event) {
        const link = (click.target as Element | null)?.closest('a');
        if (!link || !this.message) {
            return;
        }
        click.preventDefault();
        const action = this.actionOf(link);
        if (action) {
            try {
                await this.acoustic.api.executeInboxAction(action, this.id());
            } catch (error) {
                console.error('executeInboxAction failed', error);
            }
        }
    }

    /** Template messages carry the action as JSON in `action`; the default template uses `href="actionid:<key>"`. */
    private actionOf(link: Element): { [key: string]: any } | undefined {
        const json = link.getAttribute('action');
        if (json) {
            try {
                return JSON.parse(json);
            } catch {
                return undefined;
            }
        }
        const key = /^actionid:(.+)$/i.exec(link.getAttribute('href') ?? '')?.[1];
        return key ? this.message?.['content']?.actions?.[key] : undefined;
    }

    protected async delete() {
        await this.acoustic.api.deleteInboxMessage(this.id());
        this.nav.navigateBack('/inbox');
    }
}
