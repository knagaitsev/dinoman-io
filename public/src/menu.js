class Menu extends Phaser.Scene {

    constructor() {
        super('Menu');
    }

    closeAvgrund(){
        $('body').removeClass("avgrund-active");
        $('body').removeClass("avgrund-overlay");
    }

    create(config) {

        var template = "";
        var height = 210;
        if (config && config.type == "error") {
            template = `<h3>${config.title}</h3>
            <p>${config.text}</p>`;
            height = 130;
        }
        else {
            var value = "";
            if (this.nickname != "" && this.nickname !== undefined) {
                value = "value='" + this.nickname + "'";
            }
            template = `<h3>Multiplayer Pacman</h3>
            <input type='text' placeholder='Nickname' id='nickname' maxlength='13' spellcheck='false' ${value}>
            <input type='submit' value='Play'>
            `;
        }

        var e = document.createElement("button");
        $(e).avgrund({
            width: 380, // max is 640px
            height: height, // max is 350px
            showClose: false, // switch to 'true' for enabling close button
            showCloseText: '', // type your text for close button
            closeByEscape: false, // enables closing popup by 'Esc'..
            closeByDocument: false, // ..and by clicking document itself
            holderClass: 'avgrund-popup', // lets you name custom class for popin holder..
            overlayClass: '', // ..and overlay block
            enableStackAnimation: false, // another animation type
            onBlurContainer: '', // enables blur filter for specified block
            openOnEvent: false, // set to 'false' to init on load
            setEvent: 'click', // use your event like 'mouseover', 'touchmove', etc.
            onLoad: function (elem) {
            }, // set custom call before popin is inited..
            onUnload: function (elem) {}, // ..and after it was closed
            template: template
        });

        setTimeout(function() {
            $("#nickname").focus();
        }, 500);

        var self = this;
        $(".avgrund-popup input[type='submit']").one("click", function() {
            var nickname = $(".avgrund-popup input[type='text']").val();
            $(".avgrund-popup").remove();
            self.closeAvgrund();
            self.showLoadingCircle(function() {
                $.ajax({
                    url: "/ip",
                    success: function(ip) {
                        var socket = io(ip);

                        self.nickname = nickname;
                        socket.emit('nickname', nickname);

                        socket.on('config', function(data) {
                            data.socket = socket;
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
                });
            });
        });
    }

    showLoadingCircle(callback) {
        $('#phaser-overlay-container').show();
        $('#phaser-overlay-container #phaser-overlay').children().hide();
        $('#phaser-overlay-container #phaser-overlay').find('.loader').fadeIn(200, callback);
    }
}

/*
x - loading circle
text below players
notifications
better maze generation?
*/