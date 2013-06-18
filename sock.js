var a       = require('underscore');
var request = require('request');
var fs      = require('fs');
var express = require('express');
var http    = require('http');
var natural = require('natural');
var OAuth = require('OAuth');

var oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  'vhQYLoDVO3QzuXMIcpQkHw',
  '584RgksTO3MWAC3jt6aSnwqLt1sFt0XcKLphpl0SuYs',
  '1.0A',
  null,
  'HMAC-SHA1'
);


var app     = express();
var server  = http.createServer(app);
var io      = require('socket.io').listen(server);

tokenizer = new natural.WordTokenizer();

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/sock.html');
});
app.use(express.static(__dirname + '/public'))
server.listen(8081);
io.sockets.on('connection', function (socket) {
  socket.emit('firstMsg','beep boop beep... Ready to recieve');

  socket.on('twitS', function (sentence) {

    var words = sentence.replace(/[^a-zA-Z0-9 ]/g, '').replace( /[\s\n\r]+/g, ' ' ).trim().split(' ');

    var o = a.groupBy( words , function (x)
    { return a.unique( x.split(' '))  });

    var dict = a.unique(words);

    var signals = [];
    var osignals = [];
    
    var seq = [];
    for (var i=0; i < words.length ;i++) seq.push(i);

    for( d in dict){
      var index = a.filter(seq, function(kk) {return words[kk] == dict[d] });
      for(var i = 0;i < o[dict[d]].length; i++){
        signals.push(dict[d]+i);
        osignals[index[i]] = dict[d] + i;
      }
    }

    socket.emit('twitFrame',osignals);    

    a.unique( dict ).forEach( function (word , i){
      var num = o[word].length
      var setting = '&rpp='+num+'&include_entities=false&result_type=recent';
      oauth.get(
        'https://api.twitter.com/1.1/search/tweets.json?q='+word+setting,
        '328493295-Fv954vPHAAfn1zYq5ELR5ZQZiZqpxX1P0xuVYRAs',
        //you can get it at dev.twitter.com for your own apps
        'hzuPw70uI83pHpz8VOeUMTtoDYlKaOOR3mJ3GsKZw',
        //you can get it at dev.twitter.com for your own apps
        function (err, data, res){

          var obj = JSON.parse(data);

          for (var i=0;i<num;i++) {

            if(obj == undefined || obj.statuses == undefined){
              io.sockets.emit(word+i,'... Nothing... 😰 ');
            } else{
              if (obj.statuses[i] == null){
                io.sockets.emit(word+i,'... Nothing... 😰  ');
              } else {
                io.sockets.emit(word+i,obj.statuses[i].text.replace(
                  new RegExp(word,'gi') ,'<font color="darkred">'+word+'</font>').replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, function($0) {
                    if ($0.length > 60 ) return "<a href='" + $0 + "' target='_blank'>Link</a>"
                    else return "<a style='text-decoration: none;color:darkblue' href='" + $0 + "' target='_blank'>" + $0 + "</a>"}));
              }
            }
          }
      });
    });
  });
});
