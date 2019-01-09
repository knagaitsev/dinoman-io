import { Scene } from "phaser";
import MapMaker from "./map.maker";

export default class GameLoader extends Scene {

    private mapMaker: MapMaker;
    private mapData: any;

    constructor() {
        super('GameLoader');
        this.mapData = null;
    }

    init(config : any) {
        this.mapData = config.maze;
        
        // const socket = io(config.ip);/

        // socket.emit('nickname', config.nickname);

        var self = this;
        // socket.on('config', function(data) {
        //     localStorage.setItem("nickname", data.nickname);
        //     data.socket = socket;
        //     data.sizeData = config.sizeData;
        //     data.tiles = self.mapMaker;
        //     data.quadrantMode = config.quadrantMode;
            self.scene.start('Game', config);
        // });

        // socket.on('connect_error', function(error) {
        //     socket.close();
        //     self.scene.start('Menu', {
        //         type: "error",
        //         title: "Connection Error",
        //         text: "Failed to connect to the server"
        //     });
        // });

        // socket.on('connect_timeout', (timeout) => {
        //     socket.close();
        //     self.scene.start('Menu', {
        //         type: "error",
        //         title: "Connection Timeout",
        //         text: "Failed to connect to the server"
        //     });
        // });
    }
}