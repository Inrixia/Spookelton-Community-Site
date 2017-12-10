var glob = require("glob")
var async = require("async")
var fs = require('fs')
var nbt   = require('nbt-js')
var properties = require('properties')

module.exports.getServerDirs = function getServerDirs(finish) {
  var fileArray = []
  var serverArray = []

  fileArray = glob.sync("Z/*/server.properties", {ignore:'Z/System Volume Information/**'})
  fileArray = fileArray.concat(glob.sync("X/*/server.properties", {ignore:'Z/System Volume Information/**'}))
  async.each(fileArray, function (server, done) {
    serverArray.push({dir:server.slice(0, -17)})
    done()
  }, function() {
    finish(serverArray)
  })
}

module.exports.getServerVersion = function getServerVersion(serverDir) {
  return new Promise(function(resolve, reject){
    resolve(glob.sync(serverDir+'minecraft_server*.jar')[0].replace(serverDir+'minecraft_server.','').slice(0, -4))
  })
}

module.exports.getServerProperties = function getServerProperties(serverDir) {
  return new Promise(function(resolve, reject){
    properties.parse(serverDir+'server.properties', {path: true}, function(err, properties){
      if (err) reject(Error(err));
      resolve(properties);
    });
  })
}

module.exports.getServerName = function getServerName(serverDir){
  return new Promise(function(resolve, reject){
    fs.readFile(serverDir+'start.bat', "utf8", (err, data) => {
      if (err) reject(Error(err));
      resolve(/RawUI.WindowTitle = .*/.exec(data)[0].slice(21, -2));
    });
  })
}

module.exports.getFTBUtilsData = function getFTBUtilsData(serverDir, version){
  return new Promise(function(resolve, reject){
    if (version == '1.7.10') {
      fs.readFile(serverDir+'/Cookies/LatMod/LMPlayers.dat', (err, data) => {
        if (err) reject(Error(err));
        resolve(nbt.read(data).payload[''])
      });
    } else {
      var playersPromise = new Promise(function(resolve, reject){
        players = []
        glob(serverDir+'/Cookies/data/ftb_lib/players/*', function(err, files){
          if (err) reject(Error(err));
          async.each(files, function(file, done){
            players.push(nbt.read(fs.readFileSync(file)).payload[''])
            done()
          }, function() {
            resolve(players)
          })
        })
      })
      var teamsPromise = new Promise(function(resolve, reject){
        teams = []
        glob(serverDir+'/Cookies/data/ftb_lib/teams/*', function(err, files){
          if (err) reject(Error(err));
          async.each(files, function(file, done){
            teams.push(nbt.read(fs.readFileSync(file)).payload[''])
            done()
          }, function() {
            resolve(teams)
          })
        })
      })
      Promise.all([playersPromise, teamsPromise]).then(data => {
        resolve({players: data[0], teams: data[1]})
      })
    }
  })
}

module.exports.upAllServData = function upAllServData(cb){
  getServerDirs(function(serverArray){
    async.map(serverArray, function(serverObj, done){
      var promises = [
        getServerName(serverObj.dir),
        getServerProperties(serverObj.dir),
        getServerVersion(serverObj.dir)
      ]
      Promise.all(promises).then(data => {
        serverObj.name = data[0]
        serverObj.properties = data[1]
        serverObj.version = data[2]
        getFTBUtilsData(serverObj.dir, serverObj.version).then(ftbData => {
          serverObj.ftbData = ftbData
          done()
        })
      })
    }, function(){
      cb(serverArray)
    })
  })
}
