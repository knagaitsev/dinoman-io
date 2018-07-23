class Menu extends Phaser.Scene {

    constructor() {
        super('Menu');

        this.sizeData = null;
    }

    closeAvgrund(){
        $(".avgrund-popup").hide();
        // $('body').removeClass("avgrund-active");
        // $('body').removeClass("avgrund-overlay");
    }

    init(config) {
        this.nickname = localStorage.getItem("nickname");
        if (config.sizeData) {
            this.sizeData = config.sizeData;
        }
    }

    create(config) {

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
            $('#phaser-overlay-container').show();
            $('#phaser-overlay-container').css("pointer-events", "auto");
            $('#phaser-overlay-container #phaser-overlay').children().hide();
            $(".avgrund-popup.login.main").show();
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

    showLoadingCircle(callback) {
        $('#phaser-overlay-container').css("pointer-events", "none");
        $('#phaser-overlay-container').show();
        $('#phaser-overlay-container #phaser-overlay').children().hide();
        $('#phaser-overlay-container #phaser-overlay').find('.loader').fadeIn(200, callback);
    }

    startGame() {
        $(".avgrund-popup input[type='submit']").off("click");
        $(document).off("keypress");
        var self = this;
        var nickname = $(".avgrund-popup input[type='text']").val();
        //$(".avgrund-popup").remove();
        self.closeAvgrund();
        self.showLoadingCircle(function() {
            $.ajax({
                url: "ip.json",
                type: 'get',
                error: function(XMLHttpRequest, textStatus, errorThrown){
                    self.scene.start('Menu', {
                        type: "error",
                        title: "Connection Error",
                        text: "Failed to connect to the server"
                    });
                },
                success: function(rawData){
                    var data = JSON.parse(rawData);
                    var ip = data.ip;

                    var socket = io(ip);

                    socket.on('maze', function(mazeData) {
                        var data = {
                            maze: mazeData,
                            ip: ip,
                            nickname: nickname,
                            sizeData: self.sizeData
                        };
                        socket.close();
                        self.scene.start('GameLoader', data);
                    });

                    self.nickname = nickname;

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
            });
        });
    }
}

/*
x - loading circle
text below players
notifications
better maze generation?
*/