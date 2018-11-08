"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var async = require("async");
function walk(folder, filter, eachcb, donecb) {
    console.log("walk: enumarate all files");
    var all_files = [];
    //sync list
    var do_walk = function (file) {
        var stat = fs.statSync(file);
        if (stat.isDirectory()) {
            walk_folder(file);
        }
        else {
            walk_file(file);
        }
    };
    var walk_file = function (file) {
        if (filter(file)) {
            all_files.push(file);
        }
    };
    var walk_folder = function (folder) {
        var files = fs.readdirSync(folder);
        files.forEach(function (f) { return do_walk(path.join(folder, f)); });
    };
    do_walk(folder);
    var total = all_files.length;
    var p = 0;
    console.log("walk: processing " + total + " files");
    var task = setInterval(function () {
        //console.log("walk: progress "+ p + "/" + total);
        console.log("walk: progress " + (Math.floor(p * 100 / total)) + "%");
    }, 500);
    async.eachOfLimit(all_files, 200, function (v, idx, cb) {
        p += 1;
        eachcb(null, v, cb);
    }, function (err) {
        clearInterval(task);
        console.log("walk: progress 100%, done!");
        donecb();
    });
}
function build_hash_index(folder, filter, cb) {
    var cache = {};
    walk(folder, filter, function (err, file, eachdone) {
        if (err) {
            cb(err, null);
            return false;
        }
        // calculate hash
        var hash = crypto.createHash("sha256");
        fs.readFile(file, function (err, data) {
            if (err) {
                throw err;
            }
            hash.update(data);
            var key = hash.digest().toString("hex");
            // append to storage
            if (!cache[key]) {
                cache[key] = [file];
            }
            else {
                cache[key].push(file);
            }
            eachdone();
        });
        return true;
    }, function () {
        cb(null, cache);
    });
}
function list_duplicates(folder, filter, cb) {
    build_hash_index(folder, filter, function (err, storage) {
        if (err) {
            return cb(err, null);
        }
        var ret = [];
        for (var key in storage) {
            if (storage[key].length > 1) {
                ret.push(storage[key]);
            }
        }
        cb(null, ret);
    });
}
exports.list_duplicates = list_duplicates;
