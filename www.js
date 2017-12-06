var app = require('./app'),
io = require('./io'),
db = require('./db'),

server = require('http').Server(app);

db.connect('mongodb://Administrator:Sp00key@localhost:27117/spookelton?authSource=admin', function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    io.attach(server);
    server.listen(process.env.PORT || 25565, function () {
      console.log('Listening on http://localhost:' + (process.env.PORT || 25565))
    })
  }
})
