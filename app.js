var logger = require('morgan'),
express  = require('express'),
session  = require('express-session'),
passport = require('passport'),
DiscordStrategy = require('passport-discord').Strategy,
MongoStore = require('connect-mongo')(session);
app = express(),
http = require('http'),
where = require('node-where'),
db = require('./db'),
serv = require('./serverAPI')
nbt = require('nbt'),
nbtjs = require('nbt-js');
fs = require('fs'),
async = require('async'),
scopes = ['identify'];

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(logger('dev'))

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new DiscordStrategy({
    clientID: '387098195580289025',
    clientSecret: '2di4O2F4KGY__Rap87DqiKLM4Q0Yahae',
    callbackURL: 'http://spookelton.net:25565/callback'
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
        return done(null, profile);
    });
}));

app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: false, // don't create session until something stored
  resave: false, //don't save session if unmodified
  store: new MongoStore({
    url: 'mongodb://Administrator:Sp00key@localhost:27117/spookelton?authSource=admin',
    touchAfter: 24 * 3600 // time period in seconds [24 Hours]
  })
}));
app.use(passport.initialize());
app.use(passport.session());

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

app.get('/admin/giveaway', function(req, res) {
  res.render('admin/giveaway')
})

app.get('/admin/data/update', function(req, res) {
  serv.upAllServData(function(serverArray){
    async.each(serverArray, function(server, done){
      db.get().collection('servers').update({ name: server.name },{ $set: server }, { upsert: true }, function (err) { // Insert the data as a new document into the games collection
        if(err){console.log(err);}
        done();
      });
    }, function(){
      res.send('Done!<a href="/admin/data/dump">View Data Dimp</a>')
    })
  })
})

app.get('/admin/api/dump', checkAuth, function(req, res) {
  db.get().collection('servers').find({}).toArray(function(err, data){
    res.json(data);
  })
});

app.get('/admin/api/playerdata', checkAuth, function(req, res) {
  serv.breaking(function(data){
      res.json(data);
  })
});

app.get('/admin/api/player', checkAuth, function(req, res) {
  var promises = [
    new Promise(function(resolve, reject){
      db.get().collection('servers').aggregate(
      {'$unwind': "$ftbData.players"},
      {'$match': {'ftbData.players.Name': req.query.name}},
      {'$group': {
          '_id': '$ftbData.players.Name',
          'UUID': {'$last': '$ftbData.players.UUID'},
          'servers': {
              '$push': {
                  'serverName': '$name',
                  'version': '$version',
                  'dir': '$dir',
                  'properties': '$properties',
                  'lastSeen': '$ftbData.players.LastTimeSeen',
                  'lastDeath': '$ftbData.players.Data.ftbu:data.LastDeath',
                  'homes_1_7': '$ftbData.players.Homes',
                  'homes': '$ftbData.players.Data.ftbu:data.Homes',
                  'teamID': '$ftbData.players.TeamID',
                  'lastPos': '$ftbData.players.LastPos',
                  'lastItems': '$ftbData.players.LastItems',
                  'stats': '$ftbData.players.Stats',
                  }
              }
          }
      }, function(err, data) {
        resolve(data)
      })
    }),
    new Promise(function(resolve, reject){
      db.get().collection('servers').aggregate(
      {'$unwind': "$ftbData.teams"},
      {'$match': {'ftbData.teams.TeamID': 'rosareven'}},
      {'$group': {
          '_id': '$ftbData.teams.TeamID',
          'servers': {
              '$push': {
                  'serverName': '$name',
                  'team': '$ftbData.teams'
                  }
              }
          }
      }, function(err, data) {
        resolve(data)
      })
    })
  ]
  Promise.all(promises).then(data => {
    for(var i=0; i<data[0][0].servers.length; i++){
      data[0][0].servers[i].team = data[1][0].servers[i]
    }
    res.json(data[0][0]);
  })
})

app.get('/', function(req, res){
  res.render('index')
})
app.get('/login', passport.authenticate('discord', { scope: scopes }), function(req, res) {});
app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }), function(req, res) {
       res.redirect('/giveaway')
       where.is(req.ip, function(err, result){
         data = {
           discord: req.user,
           ip: req.ip,
           location: result.attributes
         }
         db.get().collection('giveaway_games').find({}).toArray(function(err, data){
           res.render('real', { user: data });
         })
       })
    } // auth success
);
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/giveaway');
});
app.get('/info', checkAuth, function(req, res) {
    where.is(req.ip, function(err, result){
      data = {
        discord: req.user,
        ip: req.ip,
        location: result.attributes
      }
      db.get().collection('users').update({ _id: req.user.id }, { $set: data }, { upsert: true }, function (err) { // Insert the data as a new document into the games collection
        if(err){console.log(err);}
      });
      res.json(data);
    })
});
app.get('/giveaway', function(req, res) {
  db.get().collection('giveaway_games').find({}).toArray(function(err, data){
    res.render('giveaway', { games: data, user: req.user });
  })
})

module.exports = app;
