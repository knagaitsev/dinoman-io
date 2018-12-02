const uuidv1 = require('uuid/v1');
const express = require("express");
const app = express();

const RSocketServer = require('rsocket-core').RSocketServer;
const RequestHandlingRSocket = require('rsocket-rpc-core').RequestHandlingRSocket;
const RSocketWebSocketServer = require('rsocket-websocket-server').default;
const MapServiceClient = require('./src/service_rsocket_pb').MapServiceClient;
const GameServiceServer = require('./src/service_rsocket_pb').GameServiceServer;
const Tail = require("./src/tail_pb");
const Size = require("./src/size_pb");
const Map = require("./src/map_pb");
const Point = require("./src/point_pb");



var Maze = require("./maze.js");
var maze = new Maze();
const mazeData = maze.generate();
const map = new Map();
mazeData.tiles.forEach(t => {
    const tail = new Tail();
    const point = new Point();
    point.setX(t.x);
    point.setY(t.y);
    t.walls.forEach(w => tail.addWalls(w));
    tail.setPoint(point);
    map.addTails(tail);
});
const size = new Size();
size.setWidth(mazeData.width);
size.setHeight(mazeData.height);
map.setSize(size);

const server = require('http').Server(app);

const rSocketServer = new RSocketServer({
    getRequestHandler: socket => {
        new MapServiceClient(socket).setup(map).subscribe();
        const handler = new RequestHandlingRSocket();
        handler.addService()
        return handler;
    },
    transport: new RSocketWebSocketServer({
        server: server
    }),
});
rSocketServer.start();
// var io = require('socket.io')(server);

app.get('/ip.json', function (req, res) {
    var ip = process.env.IP || 'http://localhost:3000';
    var obj = {
        ip: ip
    };
    res.status(200).send(JSON.stringify(obj));
});

app.use(express.static('public', {
    extensions: ['html']
}));

if (process.env.Heroku) {
    //production
} else {
    const livereload = require('livereload');

    const reloadServer = livereload.createServer({
        exts: ['js', 'html', 'css', 'png', 'json'],
        debug: true
    });

    reloadServer.watch([__dirname + "/public"]);
}

var players = {};
var sockets = {};

function getNewPlayerType() {
    var manCount = 0;
    var ghostCount = 0;
    Object.keys(players).forEach(function (key, index) {
        if (players[key].playerType == "man") {
            manCount++;
        } else if (players[key].playerType == "ghost") {
            ghostCount++;
        }
    });

    if (ghostCount < manCount) {
        return "ghost";
    } else {
        return "man";
    }
}

function collides(player1, player2) {
    var maxDist = 30;
    if (Math.abs(player1.x - player2.x) <= maxDist && Math.abs(player1.y - player2.y) <= maxDist) {
        return true;
    }
    return false;
}

function distance2(p1, p2) {
    var d1 = p1.x - p2.x;
    var d2 = p1.y - p2.y;
    return d1 * d1 + d2 * d2;
}

function findBestStartingPosition(playerType) {
    var furthestDist = -1;
    var bestStart = null;
    var starts = maze.getTilePositions();
    for (var i = 0; i < starts.length; i++) {
        var start = starts[i];
        var closestPlayerDist = -1;
        Object.keys(players).forEach(function (uuid, index) {
            var player = players[uuid];
            if (playerType != player.playerType) {
                var dist = distance2(player, start);
                if (closestPlayerDist == -1 || dist < closestPlayerDist) {
                    closestPlayerDist = dist;
                }
            }
        });

        if (closestPlayerDist > furthestDist) {
            furthestDist = closestPlayerDist;
            bestStart = start;
        }
    }

    if (bestStart === null) {
        bestStart = starts[maze.getRandomIntInclusive(0, starts.length - 1)];
    }

    return bestStart;
}

function checkSpeed(initialX, initialY, finalX, finalY, uuid) {
    var maxSpeed = 11;

    var difX = finalX - initialX;
    var difY = finalY - initialY;

    var change = Math.max(Math.abs(difX), Math.abs(difY));
    if (change > 60) {
        return false;
    }
    players[uuid].speedData.distance += change;

    var now = Date.now();
    var dt = now - players[uuid].speedData.timestamp;

    if (dt > maze.getRandomIntInclusive(5000, 6000)) {
        var playerType = players[uuid].playerType;
        var expectedSpeed;
        if (playerType == "man") {
            expectedSpeed = (dt / 4);
        } else if (playerType == "ghost") {
            expectedSpeed = (dt / 3.5);
        }

        var threshold = 200;
        if (players[uuid].speedData.count == 0) {
            threshold = 300;
        }

        //console.log(players[uuid].speedData.distance - expectedSpeed);
        if (players[uuid].speedData.distance > expectedSpeed + threshold) {
            return false;
        }

        players[uuid].speedData.distance = 0;
        players[uuid].speedData.timestamp = now;
        players[uuid].speedData.count++;
    }

    return true;
}

io.on('connection', function (socket) {

    var uuid = uuidv1();

    socket.emit('maze', mazeData);

    socket.on('nickname', function (nickname) {
        if (typeof nickname == "string" && nickname.length <= 13 && !players[uuid]) {
            nickname = nickname.replace(/[^a-zA-Z0-9. ]/g, '');
            if (nickname == "") {
                nickname = "Unnamed";
            }
            var score = 10;
            var playerType = getNewPlayerType();
            var pos = findBestStartingPosition(playerType);
            socket.emit('config', {
                players: players,
                food: maze.food,
                uuid: uuid,
                playerType: playerType,
                x: pos.x,
                y: pos.y,
                score: score,
                nickname: nickname
            });

            players[uuid] = {
                uuid: uuid,
                x: pos.x,
                y: pos.y,
                rotation: 0,
                flipX: false,
                nickname: nickname,
                score: score,
                playerType: playerType,
                timestamp: Date.now(),
                speedData: {
                    timestamp: Date.now(),
                    distance: 0,
                    count: 0
                },
                direc: 3,
                active: false
            };

            sockets[uuid] = socket;

            socket.broadcast.emit('user connected', players[uuid]);
        } else if (socket.connected) {
            socket.disconnect();
        }
    });

    socket.on('position', function (data) {
        if (players[uuid] && players[uuid].nickname !== undefined && typeof players[uuid].nickname == "string") {
            var time = Date.now();
            var dt = time - players[uuid].timestamp;
            if (data && typeof data == "object" &&
                typeof data.x == "number" && typeof data.y == "number" && typeof data.rotation == "number" &&
                typeof data.flipX == "boolean" && typeof data.direc == "number" && data.direc >= 0 && data.direc < 4 && data.direc == Math.floor(data.direc) &&
                checkSpeed(players[uuid].x, players[uuid].y, data.x, data.y, uuid) &&
                (Math.random() < .9 || maze.checkCollision(players[uuid].x, players[uuid].y, data.x, data.y, dt, players[uuid].nickname))) {

                players[uuid].timestamp = time;
                players[uuid].active = true;
                players[uuid].x = data.x;
                players[uuid].y = data.y;
                players[uuid].rotation = data.rotation;
                players[uuid].flipX = data.flipX;
                players[uuid].direc = data.direc;
                socket.broadcast.emit('user position', players[uuid]);
            } else if (socket.connected) {
                socket.disconnect();
            }
        }
    });

    socket.on('disconnect', function () {
        if (players[uuid]) {
            socket.broadcast.emit('user disconnected', uuid);
            delete players[uuid];
        }
        if (sockets[uuid]) {
            delete sockets[uuid];
        }
    });
});

var powerupEnd = Date.now();

setInterval(function () {

    if (powerupEnd <= Date.now()) {
        Object.keys(players).forEach(function (uuid1, index) {
            var player1 = players[uuid1];
            if (player1 && player1.playerType == "man") {
                Object.keys(players).forEach(function (uuid2, index) {
                    var player2 = players[uuid2];
                    if (player2 && player2.playerType == "ghost" && collides(player1, player2)) {
                        players[uuid2].score += 100;
                        if (sockets[uuid2] && sockets[uuid2].connected) {
                            sockets[uuid2].emit("score", players[uuid2].score);
                        }
                        if (sockets[uuid1] && sockets[uuid1].connected) {
                            sockets[uuid1].disconnect();
                        }
                        return false;
                    }
                });
            }
        });
    } else {
        Object.keys(players).forEach(function (uuid1, index) {
            var player1 = players[uuid1];
            if (player1 && player1.playerType == "ghost") {
                Object.keys(players).forEach(function (uuid2, index) {
                    var player2 = players[uuid2];
                    if (player2 && player2.playerType == "man" && collides(player1, player2)) {
                        players[uuid2].score += 50;
                        if (sockets[uuid2] && sockets[uuid2].connected) {
                            sockets[uuid2].emit("score", players[uuid2].score);
                        }
                        if (sockets[uuid1] && sockets[uuid1].connected) {
                            sockets[uuid1].disconnect();
                        }
                        return false;
                    }
                });
            }
        });
    }

    Object.keys(players).forEach(function (uuid, index) {
        var player = players[uuid];
        if (player && player.playerType == "man" && player.active) {
            var collisionData = maze.collideFood(player.x, player.y);
            if (sockets[uuid] && sockets[uuid].connected && collisionData) {
                var newFood = [];
                if (collisionData.type == 1) {
                    players[uuid].score += 1;
                    sockets[uuid].emit("score", players[uuid].score);
                } else if (collisionData.type == 2) {
                    var sec = 10;
                    powerupEnd = Date.now() + sec * 1000;
                }
                var addedFood = maze.addFood(Object.keys(players).length);
                newFood.push(addedFood);

                maze.food[collisionData.x][collisionData.y] = 0;
                collisionData.type = 0;
                newFood.push(collisionData);
                sockets[uuid].emit("food", newFood);
                sockets[uuid].broadcast.emit("food", newFood);
            }
        }
    });
}, 35);

setInterval(function () {
    var arr = [];
    Object.keys(players).forEach(function (uuid, index) {
        var player = players[uuid];
        var obj = {
            name: player.nickname,
            score: player.score,
            uuid: player.uuid
        };
        arr.push(obj);
    });
    arr.sort(function (player1, player2) {
        if (player1.score >= player2.score) {
            return -1;
        }

        return 1;
    });

    var leaderboard = arr.slice(0, 10);
    io.emit('leaderboard', leaderboard);
    io.emit('powerup', powerupEnd - Date.now());
}, 200);

var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log("Listening on " + port);
});