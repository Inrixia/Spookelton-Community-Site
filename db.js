var MongoClient = require('mongodb').MongoClient;

var state = {
  db: null,
}

exports.connect = function(url, done) { // Function for opening db connection
  if (state.db) return done()
  MongoClient.connect(url, function(err, db) {
    if (err) return done(err)
    state.db = db
    done()
  })
}

exports.get = function() { // Function for using db connection
  return state.db
}

exports.close = function(done) { // Function for closing db connection
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}
