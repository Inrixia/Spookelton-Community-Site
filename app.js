var logger = require('morgan'),
express  = require('express'),
session  = require('express-session'),
passport = require('passport'),
DiscordStrategy = require('passport-discord').Strategy,
MongoStore = require('connect-mongo')(session);
app = express(),
where = require('node-where'),
db = require('./db'),
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

app.get('/', function(req, res){
  res.render('index')
})
app.get('/login', passport.authenticate('discord', { scope: scopes }), function(req, res) {});
app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }), function(req, res) {
       res.redirect('/giveaway')
       console.log(res)
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
app.get('/real', checkAuth, function(req, res) {
  db.get().collection('giveaway_games').find({}).toArray(function(err, data){
    res.render('real', { user: data });
  })
})
app.get('/giveaway', function(req, res) {
  db.get().collection('giveaway_games').find({}).toArray(function(err, data){
    console.log(data)
    res.render('giveaway', { games: data, user: req.user });
  })
})
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

module.exports = app;
