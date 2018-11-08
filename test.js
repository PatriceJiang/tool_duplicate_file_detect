

const fdup = require("./index.js");
const fs = require("fs");

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

    //files.splice(files.indexOf(oldest), 1);
    console.log(oldest, mt, "is oldest in",  m);
    
}

fdup.list_duplicates("E:/Github/cocos2d-x/", (f)=>{return true;}, (err, dup)=>{
    dup.forEach(list=>{
        //console.log("duplicate ", list);
        find_oldest(list);
    });
});


