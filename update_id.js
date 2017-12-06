var http = require ('http'),
mongodb = require('mongodb'),
MongoClient = mongodb.MongoClient,
dburl = 'mongodb://Administrator:Sp00key@localhost:27117/spookelton?authSource=admin';

var url = 'http://api.steampowered.com/ISteamApps/GetAppList/v0001/'; // The url for the steamapi which returns every appid that currently exists
http.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
        MongoClient.connect(dburl, function (err, db) {
          var steamRes = JSON.parse(body);
          db.collection('games_pure').drop(); // Drop the current gamescore collection
          db.collection('games_pure').insert(steamRes.applist.apps.app); // Create a new collection with every app that exits
          db.collection('games_pure').createIndex({name: "text"});
          db.close();
        })
    });
}).on('error', function(e){
      console.log("Got an error: ", e);
});
