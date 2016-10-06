//init express services
var express=require('express');
var app = express();
var http = require('http').Server(app);
var cookieParser = require('cookie-parser');
var io = require('socket.io')(http);
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);
//custom variables
var cook = 1000;// variable for setting random Cookies
var game = 10;// variable for setting random gameNumber which will be part of URL
var collection = []; // array for storing  TicTacToe functions which created on every game in session and holds
// every information about game like cookie of X and O, all fields, chat history
app.get('/', function (req, res) { //going to main page creates a game with cookies of browser set to point on X
    if (req.cookies.cookiename == undefined) { // if our cookies are not found on browser then set them else read them
        var cookie = nextCookie();
        res.cookie('cookiename', cookie, {httpOnly: false});
    } else var cookie = parseInt(req.cookies.cookiename);
    var currentGame = (function () {
            game = game + (Math.floor(Math.random() * 10) + 1) * 4;
            return game * 678;
    })();
    collection.push(new Tictactoe(currentGame, cookie)); // set unique number of game and cookie of browser
    res.render(__dirname + '/html/index.html', {'result': currentGame});
});

app.get('/game*', function (req, res) { // url to game is "game" + number of it
    if (req.cookies.cookiename == undefined) {
        var cookie = nextCookie();
        res.cookie('cookiename', cookie, {httpOnly: false});
    } else var cookie = parseInt(req.cookies.cookiename);
  //  console.log(cookie);
    var url = req.url;
    url = url.replace('/game/', ''); // getting number of the game from url
    for (i = 0; i < collection.length; i++) // find game in collection by number
        if (collection[i].gameNumber.toString() === url) {
            if ((collection[i].second === 0) && (cookie !== collection[i].first)) collection[i].second = cookie; // second who goes to page is assigned to be O third and so on a
            // are guest, who can only contribute to chat
            if (cookie == collection[i].first) collection[i].board.whois = 'X';
            if (cookie == collection[i].second)collection[i].board.whois = 'O';
            if ((cookie != collection[i].first) && (cookie != collection[i].second)) collection[i].board.whois = 'GUEST';
            //   console.log((cookie==collection[i].second).toString()+collection[i].second+" "+cookie);
            res.render(__dirname + '/html/game.html', collection[i].board);

            return;
        }
    res.render(__dirname + '/html/error.html');
});
//server sends his responses titled gameNumber+something so only sockets with this gameNumber can receive
io.on('connection', function (socket) {
        //console.log(socket.id);
    socket.on('handshake', function (msg) { // client emits handshake an we send him chat log and online status of players and guests for his game
        for (i = 0; i < collection.length; i++)
            if (collection[i].gameNumber.toString() == msg.gameNumber) {
                collection[i].clients.push({'id': socket.id, 'whois': msg.whois});// array client holds for each tictactoe game sockets and what is assigned to it
                // all of clients for this game we find numbers of X , O and GUESTS connection and send to socket that are able to receive messages titled game number
                var xCount = 0;
                var yCount = 0;
                var guestCount = 0;
                for (k = 0; k < collection[i].clients.length; k++) {
                    if (collection[i].clients[k].whois == 'X') xCount++;
                    if (collection[i].clients[k].whois == 'O') yCount++;
                    if (collection[i].clients[k].whois == 'GUEST') guestCount++;
                }
                io.emit(msg.gameNumber.toString(), {
                    'X': xCount,
                    'O': yCount,
                    'GUESTS': guestCount
                });
                io.emit(msg.gameNumber.toString() + 'message', collection[i].chat);
                return;
            }
    });
    socket.on('move', function (msg) {
        //we need to find game with this number
        for (i = 0; i < collection.length; i++)
            if (collection[i].gameNumber.toString() == msg.gameNumber.toString()) {
            // update state of moves for this game and send to clients that able to receive  gamenumber+move
                msg.moveCount++;
                collection[i].board[msg.field] = msg.whois;
                collection[i].board.moveCount++;
                io.emit(msg.gameNumber.toString() + 'move', collection[i].board);
                break;
            }
    });
    socket.on('message', function (msg) {
        for (i = 0; i < collection.length; i++)
            //   update state of chat loh for this game and send to clients that able to receive  gamenumber+log
            if (collection[i].gameNumber.toString() == msg.gameNumber.toString()) {
                collection[i].chat.push(msg.text);
                io.emit(msg.gameNumber.toString() + 'message', collection[i].chat);
                return;
            }
    });
    socket.on('disconnect', function () {
        // we need to find socket.id in connection.sockets and update online status to this game by removing this socket id an sends to all socket from this game
        //console.log('Got disconnect!' + socket.id);
        for (i = 0; i < collection.length; i++)
            for (j = 0; j < collection[i].clients.length; j++)
                if (collection[i].clients[j].id == socket.id) {
                    collection[i].clients.splice(j);
                    var xCount = 0;
                    var yCount = 0;
                    var guestCount = 0;
                    for (k = 0; k < collection[i].clients.length; k++) {
                        if (collection[i].clients[k].whois == 'X') xCount++;
                        if (collection[i].clients[k].whois == 'O') yCount++;
                        if (collection[i].clients[k].whois == 'GUEST') guestCount++;
                    }
                    io.emit(collection[i].gameNumber.toString(), {
                        'X': xCount,
                        'O': yCount,
                        'GUESTS': guestCount
                    });
                    return;
                }
    });
});
// update next cookie number
function nextCookie() {
    cook = cook + (Math.floor(Math.random() * 30) + 1) * 4;
    return cook * 7 * 239 * 671;
}
// first and second holds cookies of a player
function Tictactoe(gameNumber, cookies) {
    this.gameNumber = gameNumber;
    this.first = cookies; // set cookies of a creator to first who plays X
    this.second = 0;
    this.chat = [];
    this.board = new Board(gameNumber);
    this.clients = [];
}

function Board(gameNumber) {
    this.gameNumber = gameNumber;
    this.whois = "X"; // this var is changes according to which board is currently transmits and has no meaning to server
    this.moveCount = 0;
    this.a1 = "";
    this.b1 = "";
    this.c1 = "";
    this.a2 = "";
    this.b2 = "";
    this.c2 = "";
    this.a3 = "";
    this.b3 = "";
    this.c3 = "";

};

http.listen(3000, function () {});