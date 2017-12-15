var fs    = require('fs');
var zlib  = require('zlib');
var nbt   = require('nbt-js');

var file  = fs.readFileSync('Z/pickle pack 3/Cookies/playerdata/02f8abf5-8d2f-4a68-962e-0741ba1af5aa.dat'); // changed file name here
//var level = zlib.gunzipSync(file);
var tag   = nbt.read(file);

console.log(JSON.stringify(tag.payload, null, 4)); // modified to format output