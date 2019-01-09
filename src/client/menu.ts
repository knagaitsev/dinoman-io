import { Scene } from 'phaser';
import { GameServiceClient } from '../shared/service_rsocket_pb';
import { Nickname, Player } from '../shared/player_pb';
import { Config } from '../shared/config_pb';

import * as $ from 'jquery';

export default class Menu extends Scene {
    nickname: string;
    config: any;
    gameService: any;

    constructor() {
        super('Menu');
    }

    closeAvgrund(){
        $(".avgrund-popup").hide();
        // $('body').removeClass("avgrund-active");
        // $('body').removeClass("avgrund-overlay");
    }

    init(config: any) {
        this.nickname = localStorage.getItem("nickname");
        this.config = config;
        this.gameService = new GameServiceClient(config.rSocket);
    }

    create(config: any) {

        //var template = "";
        //var height = 730;
        if (config && config.type == "error") {
            // template = `<h3>${config.title}</h3>
            // <p>${config.text}</p>`;
            // height = 130;
            $('#phaser-overlay-container').show();
            $('#phaser-overlay-container #phaser-overlay').children().hide();
            var loginError = $(".avgrund-popup.login-error");
            loginError.show();
            loginError.find("h3").text(config.title);
            loginError.find("p").text(config.text);
        }
        else {
            $("#phaser-container").css("background-color", "#2c9b7e");
            $('#phaser-overlay-container').show();
            $('#phaser-overlay-container').css("pointer-events", "auto");
            $('#phaser-overlay-container #phaser-overlay').children().hide();
            $(".main").show();

            if (localStorage.getItem("input-mode") == "quadrants") {
                $("#radio .toggle-right").prop( "checked", true );
            }

            var value = "";
            if (this.nickname != "" && this.nickname !== undefined && this.nickname !== null) {
                //value = "value='" + this.nickname + "'";
                value = this.nickname;
            }
            $(".avgrund-popup.login input[type='text']").val(value);

            setTimeout(function() {
                $("#nickname").focus();
            }, 500);
    
            var self = this;
            $(".avgrund-popup input[type='submit']").on("click", this.startGame.bind(this));
    
            $(document).on("keypress", function(event) {
                if (event.which == 13) {
                    self.startGame();
                }
            });
        }
    }

    startGame() {
        var quadrantMode = true;
        if ($("#radio .toggle-right").prop( "checked")) {
            localStorage.setItem("input-mode", "quadrants");
        }
        else {
            localStorage.setItem("input-mode", "swipe");
            quadrantMode = false;
        }

        $(".avgrund-popup input[type='submit']").off("click");
        $(document).off("keypress");
        var self = this;
        this.nickname = $(".avgrund-popup input[type='text']").val() as string;
        //$(".avgrund-popup").remove();
        self.closeAvgrund();
        // self.showLoadingCircle(function() {
           
                    // var data = JSON.parse(rawData);
                    // var ip = data.ip;

                    // var socket = io(ip);

                    // socket.on('maze', function(mazeData) {
                        // var data = {
                            // maze: mazeData,
                            // ip: ip,
                            // nickname: nickname,
                            // sizeData: self.sizeData,
                            // quadrantMode: quadrantMode
                        // };
                        // socket.close();
                        const nick = new Nickname()
                        nick.setValue(this.nickname);
                        this.gameService.start(nick)
                                        .then((config: Config) => {
                                            const objConfig = config.toObject();
                                            console.log(objConfig);
                                            this.scene.start('Game', { 
                                                ...this.config,
                                                quadrantMode,
                                                player: objConfig.player,
                                                players: objConfig.playersList,
                                                food: objConfig.foodList,
                                                power: objConfig.powerList,
                                            });
                                        })
                    // });

                    // self.nickname = nickname;

                    // socket.on('connect_error', function(error) {
                        // socket.close();
                //         self.scene.start('Menu', {
                //             type: "error",
                //             title: "Connection Error",
                //             text: "Failed to connect to the server"
                //         });
                //     });

                //     socket.on('connect_timeout', (timeout) => {
                //         socket.close();
                //         self.scene.start('Menu', {
                //             type: "error",
                //             title: "Connection Timeout",
                //             text: "Failed to connect to the server"
                //         });
                //     });
                // }
            // });
        // });
    }
}

/*
x - loading circle
text below players
notifications
better maze generation?
*/