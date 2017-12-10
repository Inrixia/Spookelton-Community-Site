var nbtJs = require("nbt-js")

var fs    = require('fs');
var nbt   = require('nbt-js');

var file  = fs.readFileSync('Z:/pickle pack 3/Cookies/LatMod/LMPlayers.dat');
var tag   = nbt.read(file);
console.log(tag.payload);
