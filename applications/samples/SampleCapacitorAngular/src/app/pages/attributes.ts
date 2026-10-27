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
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { AcousticService } from '../acoustic/acoustic.service';

type ValueType = 'date' | 'string' | 'bool' | 'number';
type Operation = 'update' | 'delete';

@Component({
    selector: 'app-attributes',
    imports: [
        IonBackButton,
        IonButton,
        IonButtons,
        IonContent,
        IonHeader,
        IonInput,
        IonLabel,
        IonSegment,
        IonSegmentButton,
        IonText,
        IonTitle,
        IonToolbar,
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start"><ion-back-button defaultHref="/" text="Sample" /></ion-buttons>
                <ion-title>User Attributes</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
            <ion-input
                label="Key Name"
                labelPlacement="stacked"
                fill="outline"
                [value]="attribute()"
                (ionInput)="attribute.set($any($event).detail.value)"
            />
            @if (operation() === 'update') {
                <p><b>Value</b></p>
                <ion-segment [value]="valueType()" (ionChange)="valueType.set($any($event).detail.value)">
                    @for (t of types; track t) {
                        <ion-segment-button [value]="t"><ion-label>{{ t[0].toUpperCase() + t.slice(1) }}</ion-label></ion-segment-button>
                    }
                </ion-segment>
                @if (valueType() === 'bool') {
                    <ion-segment class="ion-margin-top" [value]="boolValue()" (ionChange)="boolValue.set($any($event).detail.value)">
                        <ion-segment-button value="true"><ion-label>True</ion-label></ion-segment-button>
                        <ion-segment-button value="false"><ion-label>False</ion-label></ion-segment-button>
                    </ion-segment>
                } @else {
                    <ion-input
                        class="ion-margin-top"
                        fill="outline"
                        [type]="valueType() === 'date' ? 'date' : valueType() === 'number' ? 'number' : 'text'"
                        [value]="value()"
                        (ionInput)="value.set($any($event).detail.value)"
                    />
                }
            }
            <p><b>Operation</b></p>
            <ion-segment [value]="operation()" (ionChange)="operation.set($any($event).detail.value)">
                <ion-segment-button value="update"><ion-label>Update</ion-label></ion-segment-button>
                <ion-segment-button value="delete"><ion-label>Delete</ion-label></ion-segment-button>
            </ion-segment>
            <ion-button expand="block" class="ion-margin-top status-flash" [color]="color()" (click)="send()">
                Add to Queue
            </ion-button>
            <p><b>Status</b></p>
            <ion-text [color]="statusColor()">{{ status() }}</ion-text>
        </ion-content>
    `,
})
export class AttributesPage implements OnInit {
    private readonly acoustic = inject(AcousticService);
    protected readonly types: ValueType[] = ['date', 'string', 'bool', 'number'];
    protected readonly attribute = signal(localStorage.getItem('attribute') ?? 'attribute');
    protected readonly valueType = signal<ValueType>('string');
    protected readonly value = signal('value');
    protected readonly boolValue = signal('false');
    protected readonly operation = signal<Operation>('update');
    protected readonly status = signal('No status yet');
    protected readonly statusColor = signal('medium');
    protected readonly color = signal('primary');

    async ngOnInit() {
        if (!(await this.acoustic.ready)) {
            return;
        }
        await this.acoustic.api.setAttributeQueueCallbacks(
            this.acoustic.inZone((details) => this.result('success', details)),
            this.acoustic.inZone((error) => this.result('danger', error))
        );
    }

    protected send() {
        const attribute = this.attribute();
        localStorage.setItem('attribute', attribute);
        if (this.operation() === 'delete') {
            this.acoustic.api.queueDeleteUserAttributes([attribute]);
            this.status.set(`Queued attribute delete ${attribute}`);
        } else {
            const value = this.typedValue();
            this.acoustic.api.queueUpdateUserAttributes({ [attribute]: value });
            this.status.set(`Queued attribute update ${attribute}=${value}`);
        }
        this.statusColor.set('medium');
    }

    /** The value converted for the selected type. Dates go to Campaign as YYYY-MM-DD. */
    private typedValue(): string | number | boolean {
        switch (this.valueType()) {
            case 'bool':
                return this.boolValue() === 'true';
            case 'number': {
                const number = parseFloat(this.value());
                return isNaN(number) ? 0 : number;
            }
            case 'date': {
                const parsed = new Date(this.value());
                return (isNaN(parsed.getTime()) ? new Date() : parsed).toISOString().slice(0, 10);
            }
            default:
                return this.value();
        }
    }

    private result(color: 'success' | 'danger', details: unknown) {
        this.statusColor.set(color);
        this.status.set(JSON.stringify(details));
        this.color.set(color);
        setTimeout(() => this.color.set('primary'), 1000);
    }
}
