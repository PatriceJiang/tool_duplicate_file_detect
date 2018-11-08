
import fs = require("fs");
import path = require("path");
import crypto = require("crypto");
import async = require("async");

function walk(folder: string, filter:(file:string)=>boolean, eachcb:(err:Error, path:string, eachdone:()=>void )=>boolean, donecb:()=>void) {

    console.log("walk: enumarate all files");

    let all_files:string[] = [];
    //sync list
    let do_walk = function(file:string){
        let stat = fs.statSync(file);
        if(stat.isDirectory()) {
            walk_folder(file);
        } else{
            walk_file(file);
        }
    };

    let walk_file = function(file:string) { 
        if(filter(file)){
            all_files.push(file);
        }
    }
    let walk_folder = function(folder:string) {
        let files = fs.readdirSync(folder);
        files.forEach(f => do_walk(path.join(folder, f)));
    };

    do_walk(folder);
    let total = all_files.length;
    let p = 0;
    console.log("walk: processing "+total + " files");
    let task = setInterval(()=>{
        //console.log("walk: progress "+ p + "/" + total);
        console.log("walk: progress "+ (Math.floor(p * 100 / total)) + "%");
    }, 500);

    async.eachOfLimit(all_files, 200, (v, idx, cb)=>{
            p+=1;
            eachcb(null, v, cb);
        }, (err)=>{
            clearInterval(task);
            console.log("walk: progress 100%, done!");
            donecb();
    });

}


function build_hash_index(folder:string, filter:(file:string)=>boolean, cb:(err:Error, storage:{[index:string]:string[]})=>void)
{
    let cache:{[index:string]:string[]} = {};
    walk(folder, filter, (err, file, eachdone)=>{
        if(err) {
            cb(err, null);
            return false;
        }
        // calculate hash
        let hash = crypto.createHash("sha256");
        fs.readFile(file, (err, data)=>{
            if(err) {
                throw err;
            }
            hash.update(data);
            let key = hash.digest().toString("hex");
            // append to storage
            if(!cache[key]) {
                cache[key] = [file];
            } else {
                cache[key].push(file);
            }
            eachdone();
        });
        return true;
    }, ()=>{
        cb(null, cache);
    });
}

export function list_duplicates(folder:string, filter:(fn:string)=>boolean, cb:{(err, arg:string[][]):void}):void {
    build_hash_index(folder, filter, (err, storage)=>{
        if(err) {
            return cb(err, null);
        }
        let ret:string[][] = [];
        for(let key in storage) {
            if(storage[key].length > 1) {
                ret.push(storage[key]);
            }
        }
        cb(null, ret);
    });
}