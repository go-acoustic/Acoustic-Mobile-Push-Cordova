#!/usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");
const ANDROID_DIR = "platforms/android";

function fileExists(path) {
    try {
        return fs.statSync(path).isFile();
    } catch (e) {
        return false;
    }
}

function directoryExists(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch (e) {
        return false;
    }
}

function copy(source_filename, destination_filename) {
    try {
        console.log(
            "Copy from " +
                source_filename +
                " to " +
                ANDROID_DIR +
                "/app/" +
                destination_filename
        );
        fs.copyFileSync(
            source_filename,
            ANDROID_DIR + "/app/" + destination_filename
        );
    } catch (error) {
        console.error("Error!!: " + error);
    }
}

module.exports = function (context) {
    var platforms = context.opts.platforms;
    if (platforms.indexOf("android") !== -1 && directoryExists(ANDROID_DIR)) {
        var source_filename = "google-services.json";
        var pluginDirectory = "plugins/co.acoustic.mobile.push.plugin.fcm/";
        if (fileExists(source_filename)) {
            copy(source_filename, source_filename);
        } else if (fileExists(pluginDirectory + source_filename)) {
            copy(pluginDirectory + source_filename, source_filename);
        } else {
            console.log("Can't find file " + source_filename);
        }
    }
};
