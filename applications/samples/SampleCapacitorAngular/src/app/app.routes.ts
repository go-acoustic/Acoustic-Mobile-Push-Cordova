/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/home').then((m) => m.HomePage) },
    { path: 'registration', loadComponent: () => import('./pages/registration').then((m) => m.RegistrationPage) },
    { path: 'inbox', loadComponent: () => import('./pages/inbox').then((m) => m.InboxPage) },
    { path: 'inbox/:id', loadComponent: () => import('./pages/inbox-message').then((m) => m.InboxMessagePage) },
    { path: 'in-app', loadComponent: () => import('./pages/in-app').then((m) => m.InAppPage) },
    { path: 'custom-actions', loadComponent: () => import('./pages/custom-actions').then((m) => m.CustomActionsPage) },
    { path: 'events', loadComponent: () => import('./pages/events').then((m) => m.EventsPage) },
    { path: 'attributes', loadComponent: () => import('./pages/attributes').then((m) => m.AttributesPage) },
    { path: 'geofences', loadComponent: () => import('./pages/geofences').then((m) => m.GeofencesPage) },
    { path: '**', redirectTo: '' },
];
