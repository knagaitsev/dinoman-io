class Compass extends Phaser.Scene {

    constructor() {
        super('Compass');
    }

    init(config) {
        this.socket = config.socket;
        this.player = config.player;
        this.players = config.players;
        this.sizeData = config.sizeData;
    }

    create(config) {
        this.compass = this.add.image(60, 60, 'compass').setScale(0.6 * config.sizeData.scale);
        this.compassNeedle = this.add.image(60, 60, 'compass-needle').setScale(0.6 * config.sizeData.scale);

        this.rotatingAngle = 0;

        this.scaleChildren(this.sizeData.scale);
    }

    distance2(p1, p2) {
        var d1 = p1.x - p2.x;
        var d2 = p1.y - p2.y;
        return d1 * d1 + d2 * d2;
    }

    scaleChildren(scale) {
        var children = this.children.list;
        for (var i = 0 ; i < children.length ; i++) {
            children[i].x *= scale;
            children[i].y *= scale;
        }
    }

    update() {
        this.scaleChildren(1 / this.sizeData.scale);

        var self = this;

        var lowestDist = -1;
        var closestEnemy = null;
        Object.keys(this.players).forEach(function(key, index) {
            if (self.players[key].playerType == "man") {
                var dist = self.distance2(self.player, self.players[key]);
                if (lowestDist == -1 || dist < lowestDist) {
                    lowestDist = dist;
                    closestEnemy = self.players[key];
                }
            }
        });

        if (closestEnemy === null) {
            this.rotatingAngle += .1;
            this.compassNeedle.setRotation(this.rotatingAngle);
        }
        else {
            var pos = {
                x: closestEnemy.x,
                y: closestEnemy.y
            };
            var dif = {
                x: pos.x * this.sizeData.scale - this.player.x,
                y: pos.y * this.sizeData.scale - this.player.y
            };
    
            var angle = Math.atan2(dif.y, dif.x);
            this.compassNeedle.setRotation(angle + Math.PI / 2);
        }

        this.scaleChildren(this.sizeData.scale);
    }
}