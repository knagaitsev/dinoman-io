import RSocketWebSocketClient from 'rsocket-websocket-client';
import { Scene, Game } from 'phaser';
import { RpcClient } from 'rsocket-rpc-core';
import { BufferEncoders } from 'rsocket-core';
import { ReactiveSocket } from 'rsocket-types';
import { MapServiceServer } from '../shared/service_rsocket_pb';
import { Map } from '../shared/map_pb';
import GameScene from './game';
import Menu from './menu';
import Compass from './compass';

import * as $ from 'jquery';

export class Boot extends Scene {

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

    create(config : any) {
        let rSocket: ReactiveSocket<any, any>;
        const client = new RpcClient({
            transport: new RSocketWebSocketClient(
                {
                    url: 'ws://localhost:3000',
                },
                BufferEncoders
            ), 
            setup: {
                keepAlive: 60000,
                lifetime: 360000,
            },
            responder: new MapServiceServer({
                setup: (map: Map) => {
                    console.log(map.toObject());

                    this.scene.start('Menu', { rSocket, sizeData: config, maze: map.toObject() });
                }
            })
        });


        this.showLoadingCircle(() => 
            client
                .connect()
                .then(rsocket => {
                    console.log(rsocket);
                    rSocket = rsocket;
                })
        )

    }

    showLoadingCircle(callback: () => void) {
        $('#phaser-overlay-container').css("pointer-events", "none");
        $('#phaser-overlay-container').show();
        $('#phaser-overlay-container #phaser-overlay').children().hide();
        $(".main").hide();
        $("#phaser-container").css("background-color", "white");
        $('#phaser-overlay-container #phaser-overlay').find('.loader').fadeIn(200, callback);

    }
}

(() => {
    const normalWidth = 1280;
    const normalHeight = 720;
    const scale: number = screen.height <= 720 ? 0.5 : 1
    const zoom = 1;
    const game = new Game({
        type: Phaser.AUTO,
        parent: 'canvas-container',
        backgroundColor: '#2c9b7e',
        width: normalWidth * zoom * scale,
        height: normalHeight * zoom * scale,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scene: [Boot, Menu, GameScene, Compass],
        // scene: [Boot, Menu, GameLoader, Game, Compass]
    });
    const sizeData = {
        width: normalWidth * scale,
        height: normalHeight * scale,
        scale: scale,
        zoom: zoom
    };
    game.scene.start('Boot', sizeData);
})();

