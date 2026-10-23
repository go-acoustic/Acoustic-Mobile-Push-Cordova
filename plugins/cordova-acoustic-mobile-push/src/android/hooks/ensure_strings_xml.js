#!/usr/bin/env node

/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

// The plugin writes the application key into res/values/strings.xml with a config-file entry in plugin.xml.
// Cordova skips a config-file entry whose target file does not exist, and a new project made with
// cordova-android 14 or later has no res/values/strings.xml (its strings are in cdv_strings.xml), so the
// build failed with "string/appkey not found". This hook runs before the plugin is installed and creates
// an empty strings.xml when there is none. An existing file is not touched.

const fs = require('fs'),
    path = require('path');

const EMPTY_STRINGS = "<?xml version='1.0' encoding='utf-8'?>\n<resources>\n</resources>\n";

module.exports = function (context) {
    const candidates = [
        'platforms/android/app/src/main/res/values', // cordova-android 7 and later
        'platforms/android/res/values'               // older layout
    ];

    for (const candidate of candidates) {
        const valuesDirectory = path.join(context.opts.projectRoot, candidate);
        if (fs.existsSync(valuesDirectory)) {
            const stringsFile = path.join(valuesDirectory, 'strings.xml');
            if (!fs.existsSync(stringsFile)) {
                fs.writeFileSync(stringsFile, EMPTY_STRINGS, 'utf8');
            }
            return;
        }
    }
};
