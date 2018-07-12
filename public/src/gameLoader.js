class GameLoader extends Phaser.Scene {

    constructor() {
        super('GameLoader');
        this.mapMaker = new MapMaker(this);
        this.oldMapData = null;
    }

    init(config) {
        this.mapMaker.addTiles(config.maze, this.oldMapData);
        this.oldMapData = config.maze;
        
        var socket = io(config.ip);

        socket.emit('nickname', config.nickname);

        var self = this;
        socket.on('config', function(data) {
            localStorage.setItem("nickname", data.nickname);
            data.socket = socket;
            data.sizeData = config.sizeData;
            data.mapMaker = self.mapMaker;
            self.scene.start('Game', data);
        });

        socket.on('connect_error', function(error) {
            socket.close();
            self.scene.start('Menu', {
                type: "error",
                title: "Connection Error",
                text: "Failed to connect to the server"
            });
        });

        socket.on('connect_timeout', (timeout) => {
            socket.close();
            self.scene.start('Menu', {
                type: "error",
                title: "Connection Timeout",
                text: "Failed to connect to the server"
            });
        });
    }

    create(config) {
        
    }
}