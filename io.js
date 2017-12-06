var io = require('socket.io')(),
db = require('./db');

//ioClient = require('socket.io-client');
var uid = [];

io.on('connection', function (socket) {
  socket.on('add_game', function (data) {
    console.log(data);
  });

  socket.on('game_search', function (search) {
    db.get().collection('games_pure').find( { $text: { $search: search } }, { appid: 1, name: 1, in_giveaway: 1 } ).toArray(function(err, info) { // Find from GameCollection where game name matches textbox search
      socket.emit('return_game_search', { info });
    })
  });

  socket.on('game_add', function(appid){
    getData(appid, function(data) {
      db.get().collection('giveaway_games').insert([data], function (err, result) { // Insert the data as a new document into the games collection
        db.get().collection('games_pure').update({ appid: appid }, {$set: {"in_giveaway":true}}, function (err) { // Insert the data as a new document into the games collection
          if(err){console.log(err);}
        });
        socket.emit('return_game_add', err)
      })
    })
  })
});

function getData (id, done) {
  var url = 'http://store.steampowered.com/api/appdetails/?appids=' + id; // Generate ID for retriving game info
  http.get(url, function(res){ // Preform http request
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
      try {
        var steamRes = JSON.parse(body); // Prase returned game info into json object
        steamRes[id].name = steamRes[id].data.name; // Create a new name value at the root of the document
        delete steamRes[id].data.name; // Delete the old name value in the subdocument data
        steamRes[id]._id = id; // Set the id of the document to the game id
        steamRes = steamRes[id]; // Set steamres to equal the updated version and return it
        done(steamRes);
      } catch (e) {
        console.log(id, ": is not JSON");
      }
    });
  }).on('error', function(e){
    console.log("http error: ", e);
  });
}

  /*
  socket.on('DepositReturn', function (data) {
    console.log(data);
    //console.log(uid[data.sid]);
    if (data.stat == 'Declined') {
      db.get().collection('users').update({ _id: uid[data.sid].uid }, { $inc: { credits: +uid[data.sid].sum } }, { upsert: true }, function (err, result) {
        if (err) {
          console.log("ERROR: ", err);
        };
      });
      io.to(uid[data.sid].id).emit('r-deposit', { status: ('Trade ' + data.stat + ', Credits Deposited!') });
    } else {
      io.to(uid[data.sid].id).emit('r-deposit', { status: ('Trade ' + data.stat + ', Deposit Canceled!') });
    }
  });

  socket.on('checkout', function (data) {
    cart = JSON.parse(data.cart);
    id = cart[0].gameid;
    db.get().collection('games').findOne({ _id: id }, { storage: 1 }, function(err, data) {
      asset = data.storage[0];
      console.log(asset);
      SendGift(asset, 'catohenshall@gmail.com', 'FancyPants', 'Hi There, Take this!', 'A Person', 0, function (ret) {
        console.log(ret);
        //db.get().collection('games').findOne({ _id: id }, { storage: 1 }, function(err, data) {
        //  console.log(data);
        //});
      });
    });
  });

  socket.on('deposit', function (data) {
    var total = 0;
    async.map(data.items, processItem, function(err, results){
      db.get().collection('users').find({ _id: data.id }, { turl: 1 }).toArray(function(err, info) {
        if (typeof info[0].turl == 'undefined') {
          socket.emit('r-deposit', { status: 'No Token Set!'});
        } else {
          socket.emit('r-deposit', { status : 'Trade processing....'});
          SendRequest(data.id, info[0].turl, data.items, data.uuid, socket.id, function (ret) {
            socket.emit('r-deposit', { status: ret.info });
            uid[ret.id] = { id: socket.id, sum: total, uid: data.id };
          });
        }
      })
    });
    function processItem(item, callback){
      db.get().collection('prices').find({ name: item.name }, { safe_price: 1 }).toArray(function(err, stat){
        //item.safe_price = (stat[0].safe_price * 0.72 * 100).toFixed(0);
        total += (stat[0].safe_price * 0.72 * 100).toFixed(0) - 0;
        callback();
      })
    }
  });

  socket.on('tur', function (data) {
    console.log(data);
    db.get().collection('users').update({ _id: data.id }, { $set: data }, { upsert: true }, function (err, result) {
      if (err) {
        console.log("ERROR: ", err);
      } else {
        socket.emit('r-tur');
      };
    });
  });

  socket.on('cart-update', function (data) {
    console.log('wha');
    idl = data.id;
    var object = {};
    object[idl] = 1;
    console.log(object);
    db.get().collection('users').update({ _id: data.id }, { $addToSet: { cart: data } }, { upsert: true }, function (err, result) {
      if (err) {
        console.log("ERROR: ", err);
        socket.emit('cart-updated', { err: 'A Error Occoured!' });
      } else {
        console.log('done', data);
        socket.emit('cart-updated', { return: 'In Cart' });
      };
    });
  });

  socket.on('cart-remove', function (data) {
    console.log(data);
    db.get().collection('users').update( { _id: data.id }, { $pull: { cart: { gameid: data.gameid } } }).then(function() {
      socket.emit('cart-return');
    })
  });

function SendRequest(userID, Token, Items, uuid, sid, Inv) {
  request.post(
    'http://localhost:3001/st',
    { json: { id: userID, tok: Token, ims: Items, uuid: uuid, sid: sid } },
    function (error, response, body) {
      console.log(response.statusCode, body);
      if (!error && response.statusCode == 200) {
        Inv(body);
      }
    }
  );
};

function SendGift(id, email, name, message, signature, bot, back) {
  request.post(
    'http://localhost:3001/g',
    { json: { id: id, email: email, name: name, message: message, signature: signature, bot: bot } },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        back(body);
      }
    }
  );
};
*/

module.exports = io;
