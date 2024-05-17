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

function addAttribute(data, key, value, element) {
    var attribute = key + '="' + value + '"';
    if (data.indexOf(attribute) < 0) {
        data = data.replace(
            "<" + element,
            "<" + element + " " + attribute + " "
        );
    }

    return data;
}

module.exports = function (context) {
    var platforms = context.opts.platforms;
    if (platforms.indexOf("android") !== -1 && directoryExists(ANDROID_DIR)) {
        var source_filename = "google-services.json";
        var pluginDirectory = "plugins/cordova-acoustic-mobile-push/";
        if (fileExists(source_filename)) {
            copy(source_filename, source_filename);
        } else if (fileExists(pluginDirectory + source_filename)) {
            copy(pluginDirectory + source_filename, source_filename);
        } else {
            console.log("Can't find file " + source_filename);
        }
    }

    let fs = require("fs"),
        path = require("path");

    // android platform directory
    let platformAndroidDir = path.join(
        context.opts.projectRoot,
        "platforms/android"
    );

    // android app module directory
    let platformAndroidAppModuleDir = path.join(platformAndroidDir, "app");

    // android manifest file
    let androidManifestFile = path.join(
        platformAndroidAppModuleDir,
        "src/main/AndroidManifest.xml"
    );

    if (fs.existsSync(androidManifestFile)) {
        fs.readFile(androidManifestFile, "UTF-8", function (err, data) {
            if (err) {
                throw new Error("Unable to find AndroidManifest.xml: " + err);
            }

            data = addAttribute(
                data,
                "android:name",
                "co.acoustic.mobile.push.sdk.js.MceJsonApplication",
                "application"
            );

            data = addAttribute(
                data,
                "android:label",
                "@string/app_name",
                "application"
            );

            data = addAttribute(
                data,
                "android:icon",
                "@mipmap/ic_launcher",
                "application"
            );

            data = addAttribute(
                data,
                "android:hardwareAccelerated",
                "true",
                "application"
            );

            data = addAttribute(
                data,
                "tools:replace",
                "android:name",
                "application"
            );

            fs.writeFile(androidManifestFile, data, "UTF-8", function (err) {
                if (err)
                    throw new Error(
                        "Unable to write into AndroidManifest.xml: " + err
                    );
            });
        });
    }
};
