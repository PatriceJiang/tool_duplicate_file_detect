

const fdup = require("./index.js");
const fs = require("fs");

let to_remove =[];

function find_oldest(files) {
    let oldest;
    let mt = Number.MAX_VALUE;
    let m = [];
    for(let f of files) {
        let stat = fs.statSync(f);
        if(stat.mtime.getTime() < mt) {
            mt = stat.mtime.getTime();
            oldest = f;
        }
        m.push(stat.mtime);
    }
    let item = {};
    item.keep = oldest;
    files.splice(files.indexOf(oldest), 1);
    item.remove = files;
    to_remove.push(item);
}

function filter(x)
{
    let fn = x.toLowerCase();
    if(fn.endsWith(".jpg") || fn.endsWith(".cr2") || fn.endsWith(".png")){
        return true;
    }
    return false;
}

fdup.list_duplicates("F:/", filter, (err, dup)=>{
    dup.forEach(list=>{
        //console.log("duplicate ", list);
        find_oldest(list);
        fs.writeFileSync("delete_file.sh","#!/bin/bash\n\n" + to_remove.map(x=>"# " + x.keep+"\n" + x.remove.map(t=>"rm \""+t+"\"").join("\n")).join("\n\n"))
    });
});


