MapMaker = function(game) {
    this.game = game;
    this.tiles = null;
    this.tileSize = 100;
    this.initialized = false;

    this.width = 0;
    this.height = 0;
    this.food = [];
    this.foodSprites = [];
}

MapMaker.prototype = {
    tileDataMatches: function(oldData, newData) {
        if (oldData && newData && typeof oldData == "object" && typeof newData == "object"
         && typeof oldData.tiles == "object" && oldData.tiles instanceof Array
         && typeof newData.tiles == "object" && newData.tiles instanceof Array
         && oldData.tiles.length == newData.tiles.length
         && oldData.width == newData.width && oldData.height == newData.height) {

        }
        else {
            return false;
        }

        var oldTiles = oldData.tiles;
        var newTiles = newData.tiles;

        for (var t = 0 ; t < oldTiles.length ; t++) {
            if (oldTiles[t].x == newTiles[t].x && oldTiles[t].y == newTiles[t].y) {
                var walls1 = oldTiles[t].walls;
                var walls2 = newTiles[t].walls;
                if (walls1.length == walls2.length) {

                }
                else {
                    return false;
                }
                for (var i = 0 ; i < walls1.length ; i++) {
                    if (walls1[i] == walls2[i]) {

                    }
                    else {
                        return false;
                    }
                }
            }
            else {
                return false;
            }
        }

        return true;
    },
    addTiles: function(data, food, oldData) {

        this.width = data.width;
        this.height = data.height;
        this.food = food;

        var tiles = data.tiles;
        this.tiles = tiles;
        this.initialized = true;

        if (this.tileDataMatches(oldData, data) && this.game.textures.exists('map')) {
            this.game.add.image(-this.tileSize / 2, -this.tileSize / 2, 'map').setOrigin(0);
            return;
        }
        else if (this.game.textures.exists('map')) {
            this.game.textures.remove('map');
        }

        var canvasTexture = this.game.textures.createCanvas('map', data.width * this.tileSize, data.height * this.tileSize);
        var context = canvasTexture.context;
        var texture = this.game.textures.get('tiles');

        for (var i = 0 ; i < data.width ; i++) {
            for (var j = 0 ; j < data.height ; j++) {
                var walls;
                for (var t = 0 ; t < tiles.length ; t++) {
                    if (tiles[t].x == i && tiles[t].y == j) {
                        walls = tiles[t].walls;
                        break;
                    }
                }

                var frame = -1;
                var rotation = 0;

                var wallCount = 0;
                for (var w = 0 ; w < walls.length ; w++) {
                    if (walls[w]) {
                        wallCount++;
                    }
                }

                if (wallCount == 0) {
                    frame = 6;
                }
                else if (wallCount == 4) {
                    frame = 9;
                }
                else if (wallCount == 3) {
                    frame = 4;
                    for (var w = 0 ; w < walls.length ; w++) {
                        var wall = walls[w];
                        if (!wall) {
                            rotation = 180 - 90 * w;
                        }
                    }
                }
                else if (wallCount == 2) {
                    if (walls[0] == walls[2]) {
                        frame = 13;
                        if (walls[0]) {
                            rotation = 90;
                        }
                    }
                    else {
                        frame = 8;
                        for (var w = 0 ; w < walls.length ; w++) {
                            var wall1 = walls[w];
                            var wall2;
                            if (w == walls.length - 1) {
                                wall2 = walls[0];
                            }
                            else {
                                wall2 = walls[w+1]
                            }
    
                            if (wall1 == wall2 && wall1) {
                                rotation = -90 * w;
                            }
                        }
                    }
                }
                else if (wallCount == 1) {
                    frame = 12;
                    for (var w = 0 ; w < walls.length ; w++) {
                        var wall = walls[w];
                        if (wall) {
                            rotation = 90 - (w * 90);
                            break;
                        }
                    }
                }

                if (frame != -1) {
                    context.save();
                    context.translate(i * this.tileSize + this.tileSize / 2, j * this.tileSize + this.tileSize / 2);
                    context.rotate(Phaser.Math.DegToRad(rotation));

                    var canvasData = texture.frames[frame].canvasData;
                    context.drawImage(texture.getSourceImage(), canvasData.sx, canvasData.sy,
                        canvasData.sWidth, canvasData.sHeight, -this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);
                    //var sheet = this.game.physics.add.sprite(i * this.tileSize, j * this.tileSize, 'tiles').setScale(0.5);
                    context.restore();
                    //sheet.setFrame(frame);
                    //sheet.setRotation(Phaser.Math.DegToRad(rotation));
                }
            }
        }

        canvasTexture.refresh();
        this.game.add.image(-this.tileSize / 2, -this.tileSize / 2, 'map').setOrigin(0);

    },
    getTile: function(x, y) {
        for (var i = 0 ; i < this.tiles.length ; i++) {
            if (this.tiles[i].x == x && this.tiles[i].y == y) {
                return this.tiles[i];
            }
        }

        return false;
    },
    getNeighbor: function(tile, direction) {
        var x = tile.x;
        var y = tile.y;
        if (direction == 0) {
            y -= 1;
        }
        else if (direction == 1) {
            x -= 1;
        }
        else if (direction == 2) {
            y += 1;
        }
        else {
            x += 1;
        }

        return this.getTile(x, y);
    },
    updateFood: function(x, y) {
        var xRange = 800;
        var yRange = 600;

        for (var f = this.foodSprites.length - 1 ; f >= 0 ; f--) {
            var foodSprite = this.foodSprites[f];
            var i = foodSprite.x / this.tileSize;
            var j = foodSprite.y / this.tileSize;
            if (Math.abs(foodSprite.x - x) > xRange || Math.abs(foodSprite.y - y) > yRange || this.food[i][j] == 0 || (this.food[i][j] != foodSprite.foodType)) {
                foodSprite.destroy();
                this.foodSprites.splice(f, 1);
            }
        }

        for (var i = 0 ; i < this.width ; i++) {
            for (var j = 0 ; j < this.height ; j++) {
                var foodX = i * this.tileSize;
                var foodY = j * this.tileSize;
                if (this.food[i][j] != 0 && Math.abs(foodX - x) <= xRange && Math.abs(foodY - y) <= yRange) {
                    var spriteExists = false;
                    for (var f = 0 ; f < this.foodSprites.length ; f++) {
                        var foodSprite = this.foodSprites[f];
                        if (foodSprite.x == foodX && foodSprite.y == foodY) {
                            spriteExists = true;
                            break;
                        }
                    }
                    if (!spriteExists) {
                        var foodSprite = this.game.physics.add.sprite(i * this.tileSize, j * this.tileSize, 'food' + this.food[i][j]);
                        foodSprite.foodType = this.food[i][j];
                        this.foodSprites.push(foodSprite);
                    }
                }
            }
        }
    },
    checkCollision: function(initialX, initialY, finalX, finalY, direction, newDirection, regVec) {

        // return {
        //     x: finalX,
        //     y: finalY,
        //     success: true
        // };

        var scaledX = finalX / this.tileSize;
        var scaledY = finalY / this.tileSize;
        var initialTileX = Math.round(initialX / this.tileSize);
        var initialTileY = Math.round(initialY / this.tileSize);
        var finalTileX = Math.round(finalX / this.tileSize);
        var finalTileY = Math.round(finalY / this.tileSize);
        var tilePath = [];
        if (direction == 0 || direction == 2) {
            for (var i = 0 ; i <= Math.abs(initialTileY - finalTileY) ; i++) {
                var change = (direction == 0 ? -1 : 1) * i;
                tilePath.push({x: initialTileX, y: initialTileY + change});
            }
        }
        else {
            for (var i = 0 ; i <= Math.abs(initialTileX - finalTileX) ; i++) {
                var change = (direction == 1 ? -1 : 1) * i;
                tilePath.push({x: initialTileX + change, y: initialTileY});
            }
        }

        var threshold = 0.1;
        var extraWallSqueeze = .001;
        
        for (var t = 0 ; t < tilePath.length - 1 ; t++) {
            for (var i = 0 ; i < this.tiles.length ; i++) {
                var tile = this.tiles[i];
                var tileX = tilePath[t].x;
                var tileY = tilePath[t].y;
                if (tileX == tile.x && tileY == tile.y) {
                    var wall = tile.walls[direction];
                    if (wall) {
                        if (direction == 0 || direction == 2) {
                            return {
                                x: initialX,
                                y: tileY * this.tileSize,
                                //y: (direction == 0 ? tileY - threshold : tileY + threshold) * this.tileSize,
                                success: false
                            };
                        }
                        else {
                            return {
                                //x: (direction == 1 ? tileX - threshold : tileX + threshold) * this.tileSize,
                                x: tileX * this.tileSize,
                                y: initialY,
                                success: false
                            };
                        }
                    }
                }
            }
        }

        if (!newDirection) {
            threshold = 0;
        }

        for (var i = 0 ; i < this.tiles.length ; i++) {
            var tile = this.tiles[i];
            var tileX = tilePath[tilePath.length - 1].x;
            var tileY = tilePath[tilePath.length - 1].y;
            if (tileX == tile.x && tileY == tile.y) {
                var wall = tile.walls[direction];

                var initX = initialX / this.tileSize;
                var initY = initialY / this.tileSize;

                var hypX = (initialX + regVec.x) / this.tileSize;
                var hypY = (initialY + regVec.y) / this.tileSize;
                
                var worked = false;
                if (wall && direction == 0 && scaledY >= tileY - threshold) {
                    worked = true;
                }
                else if (wall && direction == 2 && scaledY <= tileY + threshold) {
                    worked = true;
                }
                else if (wall && direction == 1 && scaledX >= tileX - threshold) {
                    worked = true;
                }
                else if (wall && direction == 3 && scaledX <= tileX + threshold) {
                    worked = true;
                }
                else if (!wall && (direction == 0 || direction == 2) && tileX >= Math.min(initX, hypX) && tileX <= Math.max(initX, hypX)) {
                    worked = true;
                }
                else if (!wall && (direction == 1 || direction == 3) && tileY >= Math.min(initY, hypY) && tileY <= Math.max(initY, hypY)) {
                    worked = true;
                }
                else {
                    worked = false;
                }

                if (worked) {
                    if (direction == 0 || direction == 2) {
                        return {x: tileX * this.tileSize, y: finalY, success: !wall || tilePath.length > 1};
                    }
                    else {
                        return {x: finalX, y: tileY * this.tileSize, success: !wall || tilePath.length > 1};
                    }
                }
                else {
                    var success = tilePath.length > 1;
                    if (direction == 0 || direction == 2) {
                        return {
                            x: initialX,
                            y: tileY * this.tileSize,
                            //y: (direction == 0 ? tileY - threshold : tileY + threshold) * this.tileSize,
                            success: success
                        };
                    }
                    else {
                        return {
                            x: tileX * this.tileSize,
                            //x: (direction == 1 ? tileX - threshold : tileX + threshold) * this.tileSize,
                            y: initialY,
                            success: success
                        };
                    }
                }
            }
        }

        return {
            x: initialX,
            y: initialY,
            success: false
        };
    }
};