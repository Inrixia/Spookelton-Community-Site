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

app.get('/admin/api/update', function(req, res) {
  serv.upAllServData().then(result =>{
    res.json(result)
  })
})

app.get('/admin/api/dump', checkAuth, function(req, res) {
  db.get().collection('servers').find({}).toArray(function(err, data){
    res.json(data);
  })
});

app.get('/admin/api/playerdata', checkAuth, function(req, res) {
  var options = {
    name: req.query.name,
    uuid: serv.cleanUUID(req.query.uuid),
    playerdata: req.query.playerdata,
    baubles: req.query.baubles,
    thaumcraft: req.query.thaumcraft,
    ftb: req.query.ftb
  }
  serv.checkOptions(options).then(opt => {
    if (opt.error) res.send(opt.error)
    options = opt.options
    if (!req.query.server){
      db.get().collection('servers').find({}, {dir: 1, name: 1, _id: 0}).toArray(function(err, serverArray){
        res.json({error: 'Missing Server', servers: serverArray})
      })
    } else {
      serv.getPlayerData(options, req.query.server).then(data => {
        res.json(data);
      })
    }
  })
});

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
