var glob = require("glob")
var async = require("async")
var fs = require('fs')
var nbt   = require('nbt-js')
var nbtn = require('nbt')
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
        if (err) resolve({players: err});
        try {
          data = (nbt.read(data).payload[''])
          var players = []
          for(var i=1; i<data.LastID; i++){
            players.push(data.Players[i])
          }
          resolve({players: players})
        } catch(err) {
          console.log(err);
          resolve({players:err})
        }
      });
    } else {
      var playersPromise = new Promise(function(resolve, reject){
        var players = []
        glob(serverDir+'/Cookies/data/ftb_lib/players/*', function(err, files){
          if (err) resolve(err);
          try {
            async.each(files, function(file, done){
              //players.push(nbt.read(fs.readFileSync(file)).payload[''])
              done()
            }, function() {
              resolve(players)
            })
          } catch(err) {
            console.log(err);
            resolve(err)
          }
        })
      })
      var teamsPromise = new Promise(function(resolve, reject){
        var teams = []
        glob(serverDir+'/Cookies/data/ftb_lib/teams/*', function(err, files){
          if (err) resolve(err);
          try {
            async.each(files, function(file, done){
              team = nbt.read(fs.readFileSync(file)).payload['']
              team.TeamID = file.slice((serverDir+'/Cookies/data/ftb_lib/teams/').length - 1,-4)
              teams.push(team)
              done()
            }, function() {
              resolve(teams)
            })
          } catch(err) {
            console.log(err);
            resolve(err)
          }
        })
      })
      Promise.all([playersPromise, teamsPromise]).then(data => {
        resolve({players: data[0], teams: data[1]})
      })
    }
  })
}


module.exports.getPlayerData = function getPlayerData(serverDir, playerUUID, playerName){
  return new Promise(function(resolve, reject){
    playerUUID = [playerUUID.slice(0, 8), '-', playerUUID.slice(8, 12), '-', playerUUID.slice(12, 16), '-', playerUUID.slice(16, 20), '-', playerUUID.slice(20)].join('');
    console.log(nbt.read(fs.readFileSync(serverDir+'/Cookies/playerdata/'+playerUUID+'.dat')))
    //playerdata.baubles = nbt.read(fs.readFileSync(serverDir+'/Cookies/playerdata/'+playerName+'.baub')).payload['']
    resolve('nothing')
  })
}

module.exports.breaking = function breaking(done) {
playerUUID = '02f8abf58d2f4a68962e0741ba1af5aa'
playerUUID = [playerUUID.slice(0, 8), '-', playerUUID.slice(8, 12), '-', playerUUID.slice(12, 16), '-', playerUUID.slice(16, 20), '-', playerUUID.slice(20)].join('');
//console.log(nbt.read(fs.readFileSync('Z/pickle pack 3/'+'/Cookies/playerdata/'+playerUUID+'.dat')))
//console.log(nbt.read(fs.readFileSync('Z/pickle pack 3/'+'/Cookies/playerdata/test.dat')))
fs.readFile('Z/pickle pack 3/'+'/Cookies/playerdata/test.dat', function(error, file) {
  if (error) throw error;
  nbtn.parse(file, function(error, data){
    if (error) throw error;
    //console.log(data);
    done(cleanNbt(data), file)
  });
})
}

module.exports.breaking(function(data, file){
  console.log(cleanNbt(obj).Attributes);
})

function cleanNbt(obj){
  if (obj.hasOwnProperty('value')) {
    obj = cleanNbt(obj.value);
  }
  var k;
  if (obj instanceof Object) {
    for (k in obj){
      if (obj[k].hasOwnProperty('value')) {
        obj[k] = cleanNbt(obj[k].value);
      }
      cleanNbt(obj[k]);
    }
  }
  return obj
}

//module.exports.getPlayerData('Z/pickle pack 3/', '02f8abf58d2f4a68962e0741ba1af5aa', 'Electrofried').then(playerdata => {
//console.log(playerdata);
//})

module.exports.upAllServData = function upAllServData(cb){
  module.exports.getServerDirs(function(serverArray){
    async.map(serverArray, function(serverObj, done){
      var promises = [
        module.exports.getServerName(serverObj.dir),
        module.exports.getServerProperties(serverObj.dir),
        module.exports.getServerVersion(serverObj.dir)
      ]
      Promise.all(promises).then(data => {
        serverObj.name = data[0]
        serverObj.properties = data[1]
        serverObj.version = data[2]
        module.exports.getFTBUtilsData(serverObj.dir, serverObj.version).then(ftbData => {
          serverObj.ftbData = ftbData
          module.exports.escapeKeys(ftbData)
          done()
        })
      })
    }, function(){
      cb(serverArray)
    })
  })
}

module.exports.escapeKeys = function escapeKeys(obj) {
    if (!(Boolean(obj) && typeof obj == 'object'
      && Object.keys(obj).length > 0)) {
        return false;
    }
    Object.keys(obj).forEach(function(key) {
        if (typeof(obj[key]) == 'object') {
            escapeKeys(obj[key]);
        } else {
            if (key.indexOf('.') !== -1) {
                var newkey = key.replace(/\./g, '_dot_');
                obj[newkey] = obj[key];
                delete obj[key];
            }
            if (key.indexOf('$') !== -1) {
                var newkey = key.replace(/\$/g, '_amp_');
                obj[newkey] = obj[key];
                delete obj[key];
            }

        }
    });
    return true;
}
