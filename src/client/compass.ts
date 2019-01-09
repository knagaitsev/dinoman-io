import { Scene } from 'phaser';
import { ReactiveSocket } from 'rsocket-types';

export default class Compass extends Scene {
    rSocket: ReactiveSocket<any, any>;
    playerSprite: Phaser.Physics.Arcade.Sprite;
    playersSprites: Phaser.Physics.Arcade.Sprite[];
    sizeData: any;
    compass: Phaser.GameObjects.Image;
    compassNeedle: Phaser.GameObjects.Image;
    rotatingAngle: number;

    constructor() {
        super('Compass');
    }

    init(config : any) {
        this.rSocket = config.rSocket;
        this.playerSprite = config.playerSprite;
        this.playersSprites = config.playersSprites;
        this.sizeData = config.sizeData;
    }

    create(config: any) {
        this.compass = this.add.image(60, 60, 'compass').setScale(0.6 * config.sizeData.scale);
        this.compassNeedle = this.add.image(60, 60, 'compass-needle').setScale(0.6 * config.sizeData.scale);

        this.rotatingAngle = 0;

        this.scaleChildren(this.sizeData.scale);
    }

    distance2(p1: Phaser.Physics.Arcade.Sprite, p2: Phaser.Physics.Arcade.Sprite) {
        var d1 = p1.x - p2.x;
        var d2 = p1.y - p2.y;
        return d1 * d1 + d2 * d2;
    }

    scaleChildren(scale: any) {
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
        var closestEnemy: any = null;
        // Object.keys(this.players).forEach(function(key:any, index) {
            // if (self.playersSprites[key].player.type == "man") {
                // var dist = self.distance2(self.player, self.players[key]);
                // if (lowestDist == -1 || dist < lowestDist) {
                    // lowestDist = dist;
                    // closestEnemy = self.players[key];
                // }
            // }
        // });

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
                x: pos.x * this.sizeData.scale - this.playerSprite.x,
                y: pos.y * this.sizeData.scale - this.playerSprite.y
            };
    
            var angle = Math.atan2(dif.y, dif.x);
            this.compassNeedle.setRotation(angle + Math.PI / 2);
        }

        this.scaleChildren(this.sizeData.scale);
    }
    players(players: any): any {
        throw new Error("Method not implemented.");
    }
    player(player: any, arg1: any): any {
        throw new Error("Method not implemented.");
    }
}