class Compass extends Phaser.Scene {

    constructor() {
        super('Compass');
    }

    init(config) {
        this.socket = config.socket;
        this.player = config.player;
    }

    create(config) {
        this.compass = this.add.image(60, 60, 'compass').setScale(0.6);
        this.compassNeedle = this.add.image(60, 60, 'compass-needle').setScale(0.6);
    }

    update() {
        var pos = {
            x: 0,
            y: 0
        };
        var dif = {
            x: pos.x - this.player.x,
            y: pos.y - this.player.y
        };

        var angle = Math.atan2(dif.y, dif.x);
        this.compassNeedle.setRotation(angle + Math.PI / 2);
    }
}