var logger = require('morgan'),
express  = require('express'),
session  = require('express-session'),
passport = require('passport'),
DiscordStrategy = require('passport-discord').Strategy,
MongoStore = require('connect-mongo')(session);
app = express(),
scopes = ['identify'];

var index = require('./routes/index');

app.set('view engine', 'ejs');
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

app.get('/login', passport.authenticate('discord', { scope: scopes }), function(req, res) {});
app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }), function(req, res) { res.redirect('/giveaway') } // auth success
);
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
app.get('/giveaway', checkAuth, function(req, res) {
    console.log(req.user)
    res.json(req.user);
});
app.get('/info', checkAuth, function(req, res) {
    console.log(req.user)
    res.json(req.user);
});
app.get('/real', checkAuth, function(req, res) {
  db.get().collection('sesions').find({}).toArray(function(err, data){
    res.render('real', { user: data });
  })
})
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
}


app.use('/', index);

app.listen(process.env.PORT || 25565, function () {
  console.log('Listening on http://localhost:' + (process.env.PORT || 25565))
})

module.exports = app;
