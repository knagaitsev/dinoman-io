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

        this.load.spritesheet('ghost', 'asset/ghost2.png', {frameWidth: 60, frameHeight: 60});
        this.load.spritesheet('man', 'asset/man2.png', {frameWidth: 60, frameHeight: 60});

        this.load.spritesheet('tiles', 'asset/tile2.png', {frameWidth: 100, frameHeight: 100});
    }

    create(config) {
        this.scene.start('Menu', {sizeData: config});
    }
}

(function() {
    var normalWidth = 1280;
    var normalHeight = 720;
    var scale = 1;

    if (window.innerWidth <= 720) {
        scale = 0.5;
    }

    var config = {
        type: Phaser.AUTO,
        parent: 'canvas-container',
        backgroundColor: '#2c9b7e',
        width: normalWidth * scale,
        height: normalHeight * scale,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scene: [Boot, Menu, Game, Compass]
    };
    
    var game = new Phaser.Game(config);
    var sizeData = {
        width: normalWidth * scale,
        height: normalHeight * scale,
        scale: scale
    };
    game.scene.start("Boot", sizeData);
})();

$(document).ready(function() {
    var phaserContainer = $("#phaser-overlay-container");
    phaserContainer.fitToParent();
    $(window).resize(function() {
        phaserContainer.fitToParent();
    });
});