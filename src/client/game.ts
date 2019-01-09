import MapMaker from "./map.maker";
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { Player } from '../shared/player_pb';
import { Location } from '../shared/location_pb';
import { Point } from "../shared/point_pb";
import { ExtraServiceClient, PlayerServiceClient } from '../shared/service_rsocket_pb';
import * as FastBitSet from 'fastbitset';
import * as $ from 'jquery';
import { Flowable } from "rsocket-flowable";
import { Extra } from "../shared/extra_pb";

interface PlayerMotion extends Player.AsObject {
    prevDirec: number;
    motions: Location.AsObject[]
    time: number;
}

export default class Game extends Phaser.Scene {
    overlay: JQuery<HTMLElement>;
    mapMaker: MapMaker;
    config: any;
    quadrantMode: any;
    sizeData: any;
    cursors: any;
    player: Player.AsObject;
    playerSprite: Phaser.Physics.Arcade.Sprite;
    text: any;
    rSocket: any;
    direcLog: any[];
    powerupState: string;
    textOffset: number;
    timeCheck: number;
    players: { [key: string]: PlayerMotion };
    playersSprites: { [key: string]: Phaser.Physics.Arcade.Sprite };
    swipeDirec: number;
    swipeData: { startPosition: any; timestamp: any; };
    playerService: any;
    extraService: any;

    newPower: Extra[];
    newFood: Extra[];

    constructor() {
        super('Game');

        this.overlay = $("#phaser-overlay");
    }

    init(config: { maze: any; food: number[]; power: number[]; quadrantMode: any; sizeData: any; rSocket: any, player: Player.AsObject; players: Player.AsObject[]; }) {

        this.mapMaker = new MapMaker(this);
        this.mapMaker.addTiles(config.maze);
        this.mapMaker.food = new FastBitSet(config.food);
        this.mapMaker.power = new FastBitSet(config.power);

        this.config = config;

        this.quadrantMode = config.quadrantMode;

        this.sizeData = config.sizeData;

        this.cursors = null;
        this.player = config.player;
        this.players = {};
        this.playersSprites = {};
        
        
        config.players.forEach(p =>{
            this.players[p.uuid] = { ...p, motions: [p.location], prevDirec : 0, time: Date.now() };
        });


        this.text = null;
        
        this.rSocket = config.rSocket;
        this.playerService = new PlayerServiceClient(this.rSocket);
        this.extraService = new ExtraServiceClient(this.rSocket);

        (this.playerService.players(new Empty()) as Flowable<Player>)
                           .subscribe((value: Player) => {
                               if (value.getState() == Player.State.CONNECTED) {
                                   const p = value.toObject();
                                   console.log("Player connected : ", value);
                                   this.players[p.uuid] = { ...p, motions: [p.location], prevDirec : 0, time: Date.now() }
                                   this.playersSprites[p.uuid] = this.getPlayerSprite(p);
                               } else if (value.getState() == Player.State.ACTIVE) {
                                   const uuid = value.getUuid()
                                   const player: Player.AsObject = this.player.uuid == uuid ? this.player : this.players[uuid];

                                   player.location = value.getLocation().toObject();
                                //    player.motions.push(player.location);
                                   player.timestamp = value.getTimestamp();
                                   player.score = value.getScore();
                                   player.state = value.getState();

                                //    this.playersSprites[uuid].setRotation(player.location.rotation);
                                //    this.playersSprites[uuid].setFlipX(player.location.flipX);
                                //    this.playersSprites[uuid].setX(player.location.position.x);
                                //    this.playersSprites[uuid].setY(player.location.position.y);
                               } else {
                                   console.log("Player disconnected : ", value);
                                   const uuid = value.getUuid()
                                   delete this.players[uuid];
                                   this.playersSprites[uuid].destroy();
                                   delete this.playersSprites[uuid];
                               }
                           });

        (this.extraService.food(new Empty()) as Flowable<Extra>)
                          .subscribe((value: Extra) => {
                              console.log(value.toObject());
                              this.mapMaker.retainExtra(value.getLast());
                              this.mapMaker.insertFood(value.getCurrent());
                          });
        (this.extraService.power(new Empty()) as Flowable<Extra>)
                          .subscribe((value: Extra) => {
                              console.log(value.toObject());
                              this.mapMaker.retainExtra(value.getLast());
                              this.mapMaker.insertPower(value.getCurrent());
                          })

        this.direcLog = [];

        this.powerupState = "default";

        this.textOffset = 42;

        this.initOverlay(config);
        
        //$('#phaser-overlay-container #phaser-overlay').find('.loader').hide();

        // this.time = 0;

        this.timeCheck = Date.now();
    }

    create(config: { maze: any; food: number[]; power: number[]; quadrantMode: any; sizeData: any; rSocket: any; player: Player.AsObject; players: Player.AsObject[] }) {

        var self = this;

        setTimeout(function() {
            if (config.player.type == Player.Type.PACMAN) {
                self.notification("Avoid ghosts to survive!");
                setTimeout(function() {
                    self.notification("Eat food to gain points.");
                }, 10000);
            }
            else if (config.player.type == Player.Type.GHOST) {
                self.notification("Kill dinos to gain points!");
                setTimeout(function() {
                    self.notification("Use your compass to track dinos.");
                }, 10000);
            }
        }, 3000);

        this.events.on('shutdown', function() {
            self.mapMaker.shutdown();
            if (self.player.type == Player.Type.GHOST) {
                self.scene.stop('Compass');
            }
            self.hideOverlay();
        });

        // this.players = {};

        // this.socket.on('error', function(error: any) {
        //     self.socket.close();
        //     self.scene.start('Menu', {
        //         type: "error",
        //         title: "Error",
        //         text: "An error occurred with the server"
        //     });
        // });

        // this.socket.on('disconnect', function(reason: any) {
        //     self.socket.close();
        //     self.scene.start('Menu');
        // });

        this.cursors = {
            up: null,
            left: null,
            down: null,
            right: null
        };
        Object.keys(this.cursors).forEach(function(key, index) {
            self.cursors[key] = {
                isDown: false
            };
        });
        
        this.input.keyboard.on('keydown', (e: any) => {
            if (e.key == "ArrowUp") {
                this.cursors.up.isDown = true;
                this.cursors.left.isDown = false;
                this.cursors.down.isDown = false;
                this.cursors.right.isDown = false;
            }
            
            if (e.key == "ArrowLeft") {
                this.cursors.left.isDown = true;
                this.cursors.up.isDown = false;
                this.cursors.down.isDown = false;
                this.cursors.right.isDown = false;
            }
            
            if (e.key == "ArrowDown") {
                this.cursors.down.isDown = true;
                this.cursors.up.isDown = false;
                this.cursors.left.isDown = false;
                this.cursors.right.isDown = false;
            }
            
            if (e.key == "ArrowRight") {
                this.cursors.right.isDown = true;
                this.cursors.up.isDown = false;
                this.cursors.left.isDown = false;
                this.cursors.down.isDown = false;
            }
        }, this);

        this.swipeDirec = -1;

        this.swipeData = {
            startPosition: null,
            timestamp: null
        };
        if (!this.quadrantMode) {
            this.input.on("pointerup", this.endSwipe, this);
            this.input.addMoveCallback((e: any) => {
                if (self.scene.isActive("Game")) {
                    var x = e.touches[0].clientX;
                    var y = e.touches[0].clientY;
                    if (!self.swipeData.startPosition) {
                        self.swipeData.startPosition = {
                            x: x,
                            y: y
                        };
                        self.swipeData.timestamp = Date.now();
                    }
                    else if (self.swipeData.timestamp + 500 > Date.now()) {

                        var dx = x - self.swipeData.startPosition.x;
                        var dy = y - self.swipeData.startPosition.y;
                        var swipe = new Phaser.Geom.Point(dx, dy);
                        var swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
                        var swipeNormal = new Phaser.Geom.Point(swipe.x / swipeMagnitude, swipe.y / swipeMagnitude);
                        if(swipeMagnitude > 15 && (Math.abs(swipeNormal.y) > 0.6 || Math.abs(swipeNormal.x) > 0.6)) {
                            if(swipeNormal.x > 0.6) {
                                self.swipeDirec = 3
                            }
                            if(swipeNormal.x < -0.6) {
                                self.swipeDirec = 1;
                            }
                            if(swipeNormal.y > 0.6) {
                                self.swipeDirec = 2;
                            }
                            if(swipeNormal.y < -0.6) {
                                self.swipeDirec = 0;
                            }
                            self.swipeData.startPosition = null;
                        }
                    }
                    else {
                        self.swipeData.startPosition = null;
                    }
                }
            });
        }


        this.anims.create({
            key: 'eat',
            frames: this.anims.generateFrameNumbers('man', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        });

        var directionStates = ["", "-up", "-down"];

        for (var i = 0 ; i < directionStates.length ; i++) {
            this.anims.create({
                key: ("default" + directionStates[i]) + "",
                frames: this.anims.generateFrameNumbers('ghost', {frames: [0 + i]}),
                frameRate: 5,
                repeat: 0
            });
    
            this.anims.create({
                key: ("powerup" + directionStates[i]) + "",
                frames: this.anims.generateFrameNumbers('ghost', {frames: [3 + i]}),
                frameRate: 5,
                repeat: 0
            });
            
            this.anims.create({
                key: ("powerup-wearoff" + directionStates[i]) + "",
                frames: this.anims.generateFrameNumbers('ghost', {frames: [3 + i, 6 + i]}),
                frameRate: 5,
                repeat: -1
            });
        }

        // Object.keys(config.players).forEach(function(key, index) {
            // self.addPlayer((config.players as any)[key]);
        // });

        this.playerSprite = this.getPlayerSprite(this.player);
        this.text = this.getPlayerText(config);
        config.players.forEach(p => {
            this.playersSprites[p.uuid] = this.getPlayerSprite(p);
        });

        var fadeTween = this.tweens.add({
            targets: this.text,
            alpha: 0,
            duration: 500,
            delay: 3000,
            ease: 'Power1',
            repeat: 0
        });

        if (this.player.type == Player.Type.GHOST) {
            this.scene.launch('Compass', {
                socket: this.rSocket,
                player: this.player,
                players: this.players,
                sizeData: this.sizeData
            });
        }

        this.cameras.main.setSize(this.sizeData.width * this.sizeData.zoom, this.sizeData.height * this.sizeData.zoom);
        this.cameras.main.startFollow(this.playerSprite);
        //this.cameras.main.setBackgroundColor("#ff0000");

        // this.socket.on('user connected', this.addPlayer.bind(this));

        // this.socket.on('user position', function(user) {
        //     self.players[user.uuid].motionPath.push({
        //         x: user.x,
        //         y: user.y,
        //         direc: user.direc
        //     });
        //     self.players[user.uuid].x = user.x;
        //     self.players[user.uuid].y = user.y;
        //     self.players[user.uuid].rotation = user.rotation;
        //     self.players[user.uuid].flipX = user.flipX;
        //     self.players[user.uuid].prevDirec = self.players[user.uuid].direc;
        //     self.players[user.uuid].direc = user.direc;

        //     var key = user.uuid;
        //     self.players[key].sprite.setRotation(self.players[key].rotation);
        //     self.players[key].sprite.setFlipX(self.players[key].flipX);
        //     //self.players[key].sprite.x = self.players[key].x;
        //     //self.players[key].sprite.y = self.players[key].y;

        //     //self.players[key].text.x = self.players[key].x;
        //     //self.players[key].text.y = self.players[key].y + self.textOffset;

        //     var p = self.players[key];
        //     var now = Date.now();
        //     var dt = now - p.time;
        //     p.time = now;
        // });

        // this.socket.on('user disconnected', function(uuid) {
        //     self.players[uuid].sprite.destroy();
        //     self.players[uuid].text.destroy();
        //     delete self.players[uuid];
        // });

        // this.socket.on('score', function(score) {
        //     self.setScore(score);
        // });

        // this.socket.on('leaderboard', function(leaderboard) {
        //     self.setLeaderboard(leaderboard);
        // });

        // this.socket.on('powerup', function(time) {
        //     var anim = "";
        //     if (time > 0) {
        //         var wearoffSec = 3;
        //         if (time > wearoffSec * 1000) {
        //             anim = "powerup";
        //         }
        //         else {
        //             anim = "powerup-wearoff";
        //         }
        //     }
        //     else {
        //         anim = "default";
        //     }

        //     if (self.powerupState != anim && self.powerupState == "default" && (anim == "powerup" || anim == "powerup-wearoff")) {
        //         if (config.playerType == "man") {
        //             self.notification("Powerup activated! You can kill ghosts.");
        //         }
        //         else if (config.playerType == "ghost") {
        //             self.notification("Dino Powerup activated! Dinos can now kill you.");
        //         }
        //     }

        //     self.powerupState = anim;
        // });

        // this.time = Date.now();

        this.scaleChildren(this.sizeData.scale);
        this.mapMaker.setFood();
    }

    scaleChildren(scale: any) {
        var children = this.children.list;
        for (var i = 0 ; i < children.length ; i++) {
            children[i].x *= scale;
            children[i].y *= scale;
        }
    }

    getGhostAnim(direc: any) {
        var state = this.powerupState;
        if (direc == 0) {
            state += "-up";
        }
        else if (direc == 2) {
            state += "-down";
        }

        return state;
    }

    getPlayerSpeed(playerType: Player.Type, dt: number) {
        var maxSpeed = 5;
        var speed = 0;
        if (playerType == Player.Type.PACMAN) {
            speed = (dt / 4);
        }
        else if (playerType == Player.Type.GHOST && this.powerupState == "default") {
            speed = (dt / 3.6);
        }
        else if (playerType == Player.Type.GHOST && this.powerupState != "default") {
            speed = (dt / 4.5);
        }
        speed = Math.min(speed, maxSpeed);
        return speed;
    }

    lastX: number;
    lastY: number;
    update() {
        if (/*Date.now() - this.timeCheck > 100*/true) {
            //dt = Date.now() - this.timeCheck;
            //this.timeCheck = Date.now();

            this.scaleChildren(1 / this.sizeData.scale);

            var now = Date.now();
            var dt = now - this.time.now;
            // this.time = now;

            var self = this;
            Object.keys(this.players).forEach((key, index) => {
                const sprite = this.playersSprites[key];
                sprite.x = self.players[key].location.position.x;
                sprite.y = self.players[key].location.position.y;
                sprite.setRotation(self.players[key].location.rotation);
                sprite.setFlipX(self.players[key].location.flipX);
// sprite.text.x = self.players[key].x;
                // sprite.text.y = self.players[key].y + self.textOffset;
            });

            // Object.keys(this.players).forEach(function(key:any, index) {

            //     const p = self.players[key];
            //     if (Math.abs(self.playerSprite.x - p.position.x) <= self.sizeData.width / 2 / self.sizeData.scale + 100 && Math.abs(self.playerSprite.y - p.position.y) <= self.sizeData.height / 2 / self.sizeData.scale + 100) {
            //         var newDirection = (p.prevDirec !== undefined)  && p.prevDirec != p.direc;

            //         var speed = self.getPlayerSpeed(p.type, dt);
            //         var motionVec = self.getMotionVector(p.direc, speed);

            //         var motionPath = p.motionPath;
            //         if (motionPath.length > 0) {
            //             motionPath.splice(0, 1);
            //         }

            //         // var motionPath = p.motionPath;
            //         // var res;
            //         // if (motionPath.length > 0) {

            //         //     while (motionPath.length > 0 && motionPath[0].x == p.sprite.x && motionPath[0].y == p.sprite.y) {
            //         //         motionPath.splice(0, 1);
            //         //     }
            //         // }
            //         // else {
            //         //     res = self.mapMaker.checkCollision(x, y, x + motionVec.x, y + motionVec.y, p.direc, newDirection, motionVec);
            //         // }

            //         var regVec;
            //         var forceTurn = false;
            //         if (newDirection) {
            //             regVec = self.getMotionVector(p.prevDirec, speed);

            //             if (Math.abs(p.direc - p.prevDirec) != 2) {
            //                 forceTurn = true;
            //             }

            //             // p.sprite.x = p.x;
            //             // p.sprite.y = p.y;

            //             // p.text.x = p.x;
            //             // p.text.y = p.y + self.textOffset;
            //         }
            //         else {
            //             regVec = motionVec;
            //         }

            //         var x = p.sprite.x;
            //         var y = p.sprite.y;
            //         var res = self.mapMaker.checkCollision(x, y, x + motionVec.x, y + motionVec.y, p.direc, newDirection, regVec);

            //         var maxDifference = 10;
            //         // if (!newDirection) {
            //         //     maxDifference = 25;
            //         // }
            //         if (Math.abs(res.x - p.x) > maxDifference || Math.abs(res.y - p.y) > maxDifference) {
            //             var fixX = 0;
            //             var fixY = 0;
            //             if (p.direc == 0 || p.direc == 2) {
            //                 if (res.y - p.y > maxDifference) {
            //                     fixY = maxDifference;
            //                 }
            //                 else if (res.y - p.y < -maxDifference) {
            //                     fixY = -maxDifference;
            //                 }
            //             }
            //             else if (p.direc == 1 || p.direc == 3) {
            //                 if (res.x - p.x > maxDifference) {
            //                     fixX = maxDifference;
            //                 }
            //                 else if (res.x - p.x < -maxDifference) {
            //                     fixX = -maxDifference;
            //                 }
            //             }

            //             res.x = p.x + fixX;
            //             res.y = p.y + fixY;
            //         }
            //         p.sprite.x = res.x;
            //         p.sprite.y = res.y;

            //         p.text.x = res.x;
            //         p.text.y = res.y + self.textOffset;

            //         p.sprite.setAlpha(1);
            //         p.text.setAlpha(1);
            //     }
            //     else {
            //         p.sprite.setAlpha(0);
            //         p.text.setAlpha(0);
            //     }

            //     var ghostAnim = self.getGhostAnim((self.players as any)[key].direc);
            //     if ((self.players as any)[key].playerType == "ghost" && ghostAnim != (self.players as any)[key].sprite.anims.getCurrentKey()) {
            //         (self.players as any)[key].sprite.anims.play(ghostAnim);
            //     }
            // });

            this.mapMaker.updateTiles(this.playerSprite.x, this.playerSprite.y);


            Object.keys(this.players).forEach(function(key, index) {
                self.children.bringToTop((self.players as any)[key].sprite);
            });

            this.children.bringToTop(this.playerSprite);
        
            //player.setVelocity(0);
            var speed = this.getPlayerSpeed(this.player.type, dt);
        
            var prevDirec = this.player.location.direc;
            if (this.cursors.left.isDown)
            {
                this.player.location.direc = 1;
            }
            else if (this.cursors.right.isDown || this.player.location.direc == -1)
            {
                this.player.location.direc = 3;
            }
            else if (this.cursors.up.isDown)
            {
                this.player.location.direc = 0;
            }
            else if (this.cursors.down.isDown)
            {
                this.player.location.direc = 2;
            }
            else if (this.quadrantMode && this.input.activePointer.isDown) {
                var x = this.input.activePointer.x;
                var y = this.input.activePointer.y;
                var w = this.cameras.main.width;
                var h = this.cameras.main.height;

                var scaledX = (x - (w / 2)) * (h / w);
                var scaledY = y - (h / 2);
                if (Math.abs(scaledX) > Math.abs(scaledY)) {
                    if (scaledX < 0) {
                        this.player.location.direc = 1;
                    }
                    else {
                        this.player.location.direc = 3;
                    }
                }
                else {
                    if (scaledY < 0) {
                        this.player.location.direc = 0;
                    }
                    else {
                        this.player.location.direc = 2;
                    }
                }
            }
            else if (!this.quadrantMode && this.swipeDirec != -1) {
                this.player.location.direc = this.swipeDirec;
                this.swipeDirec = -1;
            }
        
            if (this.player.location.direc != -1 && this.mapMaker.initialized) {
                for (var i = 0 ; i < this.direcLog.length ; i++) {
                    this.direcLog[i].time += dt;
                }
                this.direcLog.unshift({
                    direc: this.player.location.direc,
                    time: 0
                });
                while (this.direcLog[this.direcLog.length - 1].time > 400) {
                    this.direcLog.pop();
                }
                var success = false;
                for (var i = 0 ; i < this.direcLog.length ; i++) {
                    if (this.direcLog[i].direc != prevDirec) {
                        var regVec = this.getMotionVector(prevDirec, speed);
                        var motionVec = this.getMotionVector(this.direcLog[i].direc, speed);
                        var res = this.mapMaker.checkCollision(this.playerSprite.x, this.playerSprite.y, this.playerSprite.x + motionVec.x, this.playerSprite.y + motionVec.y, this.direcLog[i].direc, true, regVec);
                        if (res.success) {
                            this.player.location.direc = this.direcLog[i].direc;
                            this.direcLog = [];
                            this.playerSprite.x = res.x;
                            this.playerSprite.y = res.y;
                            success = true;
                            break;
                        }
                    }
                }
                if (!success) {
                    var motionVec = this.getMotionVector(prevDirec, speed);
                    var res = this.mapMaker.checkCollision(this.playerSprite.x, this.playerSprite.y, this.playerSprite.x + motionVec.x, this.playerSprite.y + motionVec.y, prevDirec, false, motionVec);
                    this.player.location.direc = prevDirec;
                    this.playerSprite.x = res.x;
                    this.playerSprite.y = res.y;
                }
            }

            this.text.x = this.playerSprite.x;
            this.text.y = this.playerSprite.y + this.textOffset;
        
            if (this.player.location.direc == 1) {
                this.playerSprite.setFlipX(true);
                this.player.location.flipX = true;
                this.playerSprite.setRotation(Phaser.Math.DegToRad(0));
            }
            else if (this.player.location.direc == 3) {
                this.playerSprite.setFlipX(false);
                this.player.location.flipX = false;
                this.playerSprite.setRotation(Phaser.Math.DegToRad(0));
            }
            else if (this.player.location.direc == 0) {
                this.playerSprite.setFlipX(false);
                this.player.location.flipX = false;
                if (this.player.type == Player.Type.PACMAN)
                    this.playerSprite.setRotation(Phaser.Math.DegToRad(270));
            }
            else if (this.player.location.direc == 2) {
                this.playerSprite.setFlipX(false);
                this.player.location.flipX = false;
                if (this.player.type == Player.Type.PACMAN)
                    this.playerSprite.setRotation(Phaser.Math.DegToRad(90));
            }

            var ghostAnim = this.getGhostAnim(this.player.location.direc);
            if (this.player.type == Player.Type.GHOST && ghostAnim != this.playerSprite.anims.getCurrentKey()) {
                self.playerSprite.anims.play(ghostAnim);
            }
            
            const currentX = this.playerSprite.x;
            const currentY = this.playerSprite.y;
            
            
            if (this.lastX != currentX || this.lastY != currentY) {
                // console.log("Current player position: {X: %s, Y: %s}", this.playerSprite.x / 100, this.playerSprite.y / 100);
                const location = new Location();
                const position = new Point();

                position.setX(currentX);
                position.setY(currentY);

                this.lastX = currentX;
                this.lastY = currentY;

                location.setPosition(position);
                location.setRotation(this.playerSprite.rotation);
                location.setFlipX(this.playerSprite.flipX);
                location.setDirec(this.player.location.direc);

                this.playerService.locate(location);
            }

            this.scaleChildren(this.sizeData.scale);
        }
    }

    addPlayer(user: any) {
        (this.players as any)[user.uuid] = user;
        (this.players as any)[user.uuid].motionPath = [];
        (this.players as any)[user.uuid].motionPath.push({
            x: user.x,
            y: user.y,
            direc: user.direc
        });
        // this.playersSprites[user.uuid].sprite = this.getPlayerSprite(user);
        // this.playersSprites[user.uuid].text = this.getPlayerText(user);
        // this.playersSprites[user.uuid].time = Date.now();
        this.children.bringToTop(this.playerSprite);
    }

    getPlayerSprite(user: Player.AsObject): Phaser.Physics.Arcade.Sprite {
        var sprite = this.physics.add.sprite(user.location.position.x, user.location.position.y, user.type == Player.Type.GHOST ? "ghost" : "man").setScale(this.sizeData.scale);
        if (user.type == Player.Type.PACMAN) {
            sprite.anims.play("eat");
        }
        else if (user.type == Player.Type.GHOST) {
            sprite.anims.play(this.getGhostAnim(3));
        }
        return sprite;
    }

    getPlayerText(user: any) {
        var text = this.add.text(user.x, user.y + this.textOffset, user.nickname, { fontFamily: 'Arial', fontSize: '18px', fill: 'rgba(255,255,255,0.8)' });
        text.setScale(this.sizeData.scale);
        text.setOrigin(0.5);
        return text;
    }

    getMotionVector(direc: any, speed: number) {
        var obj = {
            x: 0,
            y: 0
        };
        if (direc == 1) {
            obj.x -= speed;
        }
        else if (direc == 3) {
            obj.x += speed;
        }
        else if (direc == 0) {
            obj.y -= speed;
        }
        else if (direc == 2) {
            obj.y += speed;
        }
    
        return obj;
    }

    initOverlay(config: any) {
        $('#phaser-overlay-container').show();
        $('#phaser-overlay-container #phaser-overlay').children().show();
        $('#phaser-overlay-container #phaser-overlay').find('.loader').hide();
        $(".login").hide();
        $(".main").hide();
        var overlay = this.overlay;
        overlay.find('.notification-tray').empty();
        this.setScore(config.score);
        this.setLeaderboard([]);
    }

    hideOverlay() {
        $('#phaser-overlay-container').hide();
        $('#phaser-overlay-container #phaser-overlay').children().hide();
    }

    toggleLoader() {

    }

    setScore(score: any) {
        var overlay = this.overlay;
        overlay.find(".score").find("p").text("Score: " + score);
    }

    setLeaderboard(data: any) {
        var overlay = this.overlay;
        var leaderboard = overlay.find(".leaderboard").find('ol');
        leaderboard.empty();
        for (var i = 0 ; i < data.length ; i++) {
            var elem = $("<li></li>");
            elem.text(data[i].name + " - " + data[i].score);
            if (data[i].uuid == this.player.uuid) {
                elem.addClass('me');
            }
            elem.appendTo(leaderboard);
        }
    }

    notification(text: string) {
        var overlay = this.overlay;
        var target = overlay.find(".notification-tray");
        var elem = $("<div></div>");
        var p = $("<p></p>");
        p.text(text);
        p.appendTo(elem);
        elem.prependTo(target);
        elem.hide();
        var fadeTime = 500;
        var readTime = 7000;
        elem.fadeIn(fadeTime, function() {
            setTimeout(function() {
                elem.fadeOut(fadeTime, function() {
                    elem.remove();
                });
            }, readTime);
        });
    }

    endSwipe(e: any) {
        this.swipeData.startPosition = null;

        // var swipeTime = e.upTime - e.downTime;
        // var swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
        // var swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
        // var swipeNormal = new Phaser.Geom.Point(swipe.x / swipeMagnitude, swipe.y / swipeMagnitude);
        // if(swipeMagnitude > 20 && swipeTime < 1000 && (Math.abs(swipeNormal.y) > 0.6 || Math.abs(swipeNormal.x) > 0.6)) {
        //     if(swipeNormal.x > 0.6) {
        //         this.swipeDirec = 3
        //     }
        //     if(swipeNormal.x < -0.6) {
        //         this.swipeDirec = 1;
        //     }
        //     if(swipeNormal.y > 0.6) {
        //         this.swipeDirec = 2;
        //     }
        //     if(swipeNormal.y < -0.6) {
        //         this.swipeDirec = 0;
        //     }
        // }
    }
}