class Boot extends Phaser.Scene {

    constructor() {
        super('Boot');
    }

    preload() {
        
        this.load.image('logo', 'asset/logo.png');

        this.load.image('food1', 'asset/food1.png');
        this.load.image('food2', 'asset/food2.png');

        this.load.image('compass', 'asset/compass.png');
        this.load.image('compass-needle', 'asset/compass-needle.png');

        this.load.spritesheet('ghost', 'asset/ghost2.png', {frameWidth: 100, frameHeight: 100});
        this.load.spritesheet('man', 'asset/man2.png', {frameWidth: 100, frameHeight: 100});

        this.load.spritesheet('tiles', 'asset/tile2.png', {frameWidth: 200, frameHeight: 200});
    }

    create() {
        this.scene.start('Menu');
    }
}

(function() {
    var config = {
        type: Phaser.AUTO,
        parent: 'canvas-container',
        backgroundColor: '#2c9b7e',
        width: 1280,
        height: 720,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scene: [Boot, Menu, Game, Compass]
    };
    
    var game = new Phaser.Game(config);
})();

$(document).ready(function() {
    var phaserContainer = $("#phaser-overlay-container");
    phaserContainer.fitToParent();
    $(window).resize(function() {
        phaserContainer.fitToParent();
    });
});