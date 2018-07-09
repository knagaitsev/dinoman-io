class Game extends Phaser.Scene {

    constructor() {
        super('Game');

        this.overlay = $("#phaser-overlay");

        this.oldMapData = null;
    }

    preload() {
    }

    init(config) {
        this.config = config;
        this.cursors = null;
        this.player = null;
        this.text = null;

        this.uuid = config.uuid;

        this.socket = config.socket;

        this.mapMaker = new MapMaker(this);

        this.flipX = false;

        this.direc = 3;
        this.direcLog = [];

        this.powerupState = "default";

        this.playerType = config.playerType;

        this.textOffset = 42;

        this.initOverlay(config);
    }

    create(config) {

        var self = this;

        setTimeout(function() {
            if (config.playerType == "man") {
                self.notification("Avoid ghosts to survive!");
                setTimeout(function() {
                    self.notification("Eat food to gain points.");
                }, 10000);
            }
            else if (config.playerType == "ghost") {
                self.notification("Kill dinos to gain points!");
                setTimeout(function() {
                    self.notification("Use your compass to track dinos.");
                }, 10000);
            }
        }, 3000);

        this.events.on('shutdown', function() {
            if (self.playerType == "ghost") {
                self.scene.stop('Compass');
            }
            self.hideOverlay();
        });

        this.players = {};

        this.socket.on('error', function(error) {
            self.socket.close();
            self.scene.start('Menu', {
                type: "error",
                title: "Error",
                text: "An error occurred with the server"
            });
        });

        this.socket.on('disconnect', function(reason) {
            self.socket.close();
            self.scene.start('Menu');
        });
        
        this.mapMaker.addTiles(config.maze, config.food, this.oldMapData);
        this.oldMapData = config.maze;

        this.socket.on('food', function(food) {
            if (typeof food == "object" && food instanceof Array) {
                for (var i = 0 ; i < food.length ; i++) {
                    self.mapMaker.food[food[i].x][food[i].y] = food[i].type;
                }
            }
            else if (typeof food == "object") {
                self.mapMaker.food[food.x][food.y] = food.type;
            }
        });

        this.cursors = this.input.keyboard.createCursorKeys();

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

        Object.keys(config.players).forEach(function(key, index) {
            self.addPlayer(config.players[key]);
        });

        this.player = this.getPlayerSprite(config);
        this.text = this.getPlayerText(config);

        var fadeTween = this.tweens.add({
            targets: this.text,
            alpha: 0,
            duration: 500,
            delay: 3000,
            ease: 'Power1',
            repeat: 0
        });

        if (this.playerType == "ghost") {
            this.scene.launch('Compass', {
                socket: this.socket,
                player: this.player,
                players: this.players
            });
        }

        this.cameras.main.setSize(1280, 720);
        this.cameras.main.startFollow(this.player);
        //this.cameras.main.setBackgroundColor("#ff0000");

        this.socket.on('user connected', this.addPlayer.bind(this));

        this.socket.on('user position', function(user) {
            self.players[user.uuid].x = user.x;
            self.players[user.uuid].y = user.y;
            self.players[user.uuid].rotation = user.rotation;
            self.players[user.uuid].flipX = user.flipX;
            self.players[user.uuid].direc = user.direc;
        });

        this.socket.on('user disconnected', function(uuid) {
            self.players[uuid].sprite.destroy();
            self.players[uuid].text.destroy();
            delete self.players[uuid];
        });

        this.socket.on('score', function(score) {
            self.setScore(score);
        });

        this.socket.on('leaderboard', function(leaderboard) {
            self.setLeaderboard(leaderboard);
        });

        this.socket.on('powerup', function(time) {
            var anim = "";
            if (time > 0) {
                var wearoffSec = 3;
                if (time > wearoffSec * 1000) {
                    anim = "powerup";
                }
                else {
                    anim = "powerup-wearoff";
                }
            }
            else {
                anim = "default";
            }

            if (self.powerupState != anim && self.powerupState == "default" && (anim == "powerup" || anim == "powerup-wearoff")) {
                if (config.playerType == "man") {
                    self.notification("Powerup activated! You can kill ghosts.");
                }
                else if (config.playerType == "ghost") {
                    self.notification("Dino Powerup activated! Dinos can now kill you.");
                }
            }

            self.powerupState = anim;
        });
    }

    getGhostAnim(direc) {
        var state = this.powerupState;
        if (direc == 0) {
            state += "-up";
        }
        else if (direc == 2) {
            state += "-down";
        }

        return state;
    }

    update(timestep, dt) {

        var self = this;
        Object.keys(this.players).forEach(function(key, index) {
            self.players[key].sprite.x = self.players[key].x;
            self.players[key].sprite.y = self.players[key].y;
            self.players[key].sprite.setRotation(self.players[key].rotation);
            self.players[key].sprite.setFlipX(self.players[key].flipX);

            self.players[key].text.x = self.players[key].x;
            self.players[key].text.y = self.players[key].y + self.textOffset;
        });

        Object.keys(this.players).forEach(function(key, index) {
            var ghostAnim = self.getGhostAnim(self.players[key].direc);
            if (self.players[key].playerType == "ghost" && ghostAnim != self.players[key].sprite.anims.getCurrentKey()) {
                self.players[key].sprite.anims.play(ghostAnim);
            }
        });

        this.mapMaker.updateFood(this.player.x, this.player.y);

        this.children.bringToTop(this.player);
    
        //player.setVelocity(0);
        var maxSpeed = 10;
        var speed = (dt / 4);
        speed = Math.min(speed, maxSpeed);
    
        var prevDirec = this.direc;
        if (this.cursors.left.isDown)
        {
            this.direc = 1;
        }
        else if (this.cursors.right.isDown || this.direc == -1)
        {
            this.direc = 3;
        }
        else if (this.cursors.up.isDown)
        {
            this.direc = 0;
        }
        else if (this.cursors.down.isDown)
        {
            this.direc = 2;
        }
    
        if (this.direc != -1 && this.mapMaker.initialized) {
            for (var i = 0 ; i < this.direcLog.length ; i++) {
                this.direcLog[i].time += dt;
            }
            this.direcLog.unshift({
                direc: this.direc,
                time: 0
            });
             while (this.direcLog[this.direcLog.length - 1].time > 300) {
                this.direcLog.pop();
            }
            var success = false;
            for (var i = 0 ; i < this.direcLog.length ; i++) {
                if (this.direcLog[i].direc != prevDirec) {
                    var regVec = this.getMotionVector(prevDirec, speed);
                    var motionVec = this.getMotionVector(this.direcLog[i].direc, speed);
                    var res = this.mapMaker.checkCollision(this.player.x, this.player.y, this.player.x + motionVec.x, this.player.y + motionVec.y, this.direcLog[i].direc, true, regVec);
                    if (res.success) {
                        this.direc = this.direcLog[i].direc;
                        this.direcLog = [];
                        this.player.x = res.x;
                        this.player.y = res.y;
                        success = true;
                        break;
                    }
                }
            }
            if (!success) {
                var motionVec = this.getMotionVector(prevDirec, speed);
                var res = this.mapMaker.checkCollision(this.player.x, this.player.y, this.player.x + motionVec.x, this.player.y + motionVec.y, prevDirec, false, motionVec);
                this.direc = prevDirec;
                this.player.x = res.x;
                this.player.y = res.y;
            }
        }

        this.text.x = this.player.x;
        this.text.y = this.player.y + this.textOffset;
    
        if (this.direc == 1) {
            this.player.setFlipX(true);
            this.flipX = true;
            this.player.setRotation(Phaser.Math.DegToRad(0));
        }
        else if (this.direc == 3) {
            this.player.setFlipX(false);
            this.flipX = false;
            this.player.setRotation(Phaser.Math.DegToRad(0));
        }
        else if (this.direc == 0) {
            this.player.setFlipX(false);
            this.flipX = false;
            if (this.playerType == "man")
                this.player.setRotation(Phaser.Math.DegToRad(270));
        }
        else if (this.direc == 2) {
            this.player.setFlipX(false);
            this.flipX = false;
            if (this.playerType == "man")
                this.player.setRotation(Phaser.Math.DegToRad(90));
        }

        var ghostAnim = this.getGhostAnim(this.direc);
        if (this.playerType == "ghost" && ghostAnim != this.player.anims.getCurrentKey()) {
            self.player.anims.play(ghostAnim);
        }
    
        if (this.socket) {
            this.socket.emit("position", {x: this.player.x, y: this.player.y, rotation: this.player.rotation, flipX: this.flipX, direc: this.direc});
        }
    }

    addPlayer(user) {
        this.players[user.uuid] = user;
        this.players[user.uuid].sprite = this.getPlayerSprite(user);
        this.players[user.uuid].text = this.getPlayerText(user);
        this.children.bringToTop(this.player);
    }

    getPlayerSprite(user) {
        var sprite = this.physics.add.sprite(user.x, user.y, user.playerType).setScale(0.6);
        if (user.playerType == "man") {
            sprite.anims.play("eat");
        }
        else if (user.playerType == "ghost") {
            sprite.anims.play(this.getGhostAnim(3));
        }
        return sprite;
    }

    getPlayerText(user) {
        var text = this.add.text(user.x, user.y + this.textOffset, user.nickname, { fontFamily: 'Arial', fontSize: '18px', fill: 'rgba(255,255,255,0.8)' });
        text.setOrigin(0.5);
        return text;
    }

    getMotionVector(direc, speed) {
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

    initOverlay(config) {
        $('#phaser-overlay-container').show();
        $('#phaser-overlay-container #phaser-overlay').children().show();
        $('#phaser-overlay-container #phaser-overlay').find('.loader').hide();
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

    setScore(score) {
        var overlay = this.overlay;
        overlay.find(".score").find("p").text("Score: " + score);
    }

    setLeaderboard(data) {
        var overlay = this.overlay;
        var leaderboard = overlay.find(".leaderboard").find('ol');
        leaderboard.empty();
        for (var i = 0 ; i < data.length ; i++) {
            var elem = $("<li></li>");
            elem.text(data[i].name + " - " + data[i].score);
            if (data[i].uuid == this.uuid) {
                elem.addClass('me');
            }
            elem.appendTo(leaderboard);
        }
    }

    notification(text) {
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
}