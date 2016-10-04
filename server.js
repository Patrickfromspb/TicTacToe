var express = require('express');
var app = express();
var http = require('http').Server(app);
var cookieParser = require('cookie-parser');
var io = require('socket.io')(http);
var cook=1000;
var game=10;
var collection=[];
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.engine('html', require('ejs').renderFile);
app.get('/', function(req, res){
    if (req.cookies.cookiename==undefined) {
        var cookie = nextCookie();
        res.cookie('cookiename', cookie, {httpOnly: false});
    } else var cookie=parseInt(req.cookies.cookiename);
    var currentGame=nextGame();
    collection.push( new tictactoe(currentGame,cookie));
    res.render(__dirname + '/html/index.html', {'result': currentGame});
});

app.get('/game*', function(req, res){
    if (req.cookies.cookiename==undefined) {
        var cookie = nextCookie();
        res.cookie('cookiename', cookie, {httpOnly: false});
    } else var cookie=parseInt(req.cookies.cookiename);
    var url=req.url;
    url=url.replace('/game/','');
    for (i = 0; i < collection.length; i++)
       if (collection[i].gameNumber.toString()===url) {
           if ((collection[i].second===0) &&(cookie!==collection[i].first)) collection[i].second=cookie;
           if (cookie==collection[i].first) collection[i].board.whois='X';
           else if (cookie==collection[i].second)collection[i].board.whois='O';
           else collection[i].whois.board='GUEST';
           res.render(__dirname + '/html/game.html',collection[i].board);

           return;
             }
    res.render(__dirname + '/html/error.html');
});

io.on('connection', function(socket){
    console.log(socket.id);
    socket.on('handshake', function(msg){
        console.log('message:'+ JSON.stringify(msg));
        detectionChanges(msg.gameNumber)
    });
    socket.on('move', function(msg){
        console.log('move:'+ JSON.stringify(msg));
        for(i=0;i<collection.length;i++)
            if (collection[i].gameNumber.toString() == msg.gameNumber.toString()) {
                io.emit(msg.gameNumber.toString()+'move', msg);
                collection[i].board[msg.field]=msg.whois;
                console.log(JSON.stringify(collection[i]));
                break;
            }



    });
});
function detectionChanges(gameNumberString) {
    for(i=0;i<collection.length;i++)
        if (collection[i].gameNumber.toString() == gameNumberString) {
            if (gameNumberString.whois == 'X') collection[i].X = true;
            else if (gameNumberString.whois == 'O') collection[i].O = true;
            else collection[i].GUESTS++;
            io.emit(gameNumberString, {
                'X': collection[i].X,
                'O': collection[i].O,
                'GUESTS': collection[i].GUESTS
            });
            break;
        }
}
function nextCookie() {
    cook++;
    return cook*7*239*671;
}
function nextGame() {
    game++;
    return game*678*567*347;
}
http.listen(3000, function(){
    console.log('listening on *:3000');
});
function tictactoe(gameNumber,cookies) {
    this.gameNumber=gameNumber;
    this.first=cookies;
    this.second=0;
    this.X=false;
    this.Y=false;
    this.GUESTS=0;
    this.chat=[];
    this.board= new Board(gameNumber);
    this.X=false;
    this.O=false;
    this.GUESTS=0;
}
function Board(gameNumber) {
    this.gameNumber=gameNumber;
    this.a1="";
    this.b1="";
    this.c1="";
    this.a2="";
    this.b2="X";
    this.c2="";
    this.a3="";
    this.b3="";
    this.c3="";
    this.whois="X";
}