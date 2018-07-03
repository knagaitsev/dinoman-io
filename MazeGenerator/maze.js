var SimplexNoise = require("simplex-noise");

module.exports = function() {

    this.simplex = new SimplexNoise("seed");

    this.data = null;

    this.tiles = [];

    this.tileSize = 100;
    
    this.width = 40;
    this.height = 40;
    this.foodBorder = 5;

    this.food = [];

    this.foodChance = 0.3;

    for (var i = 0 ; i < this.width ; i++) {
        this.food[i] = new Array(this.height).fill(0);
    }
}

module.exports.prototype = {
    generate: function() {
        var arr = [];

        var size = this.size;

        for (var i = 0 ; i < this.width ; i++) {
            arr[i] = new Array(this.height).fill(-1);
        }

        var count = 0;
        var bounds = 10;
        for (var i = bounds ; i < this.width - bounds ; i++) {
            for (var j = bounds ; j < this.height - bounds ; j++) {
                if (arr[i] === undefined) {
                    arr[i] = [];
                }

                if (arr[i][j] === undefined || arr[i][j] == -1) {
                    var shapeNum = count;
                    arr[i][j] = shapeNum;
                    var shapeCount = 0;
                    var offsetX = 0;
                    var offsetY = 0;
                    while (shapeCount < 6) {
                        
                        var direcChoice = this.simplex.noise2D(i + offsetX, j + offsetY);
                        var direc = Math.floor((direcChoice + 1) * 2);
                        var changeX = 0;
                        var changeY = 0;
                        var direcCount = 0;
                        do {
                            if (direc == 0) {
                                changeX = 1;
                            }
                            else if (direc == 1) {
                                changeX = -1;
                            }
                            else if (direc == 2) {
                                changeY = 1;
                            }
                            else {
                                changeY = -1;
                            }
                            
                            var elem = arr[i + offsetX + changeX][j + offsetY + changeY];
                            if (elem === undefined || elem == -1) {
                                offsetX += changeX;
                                offsetY += changeY;
                                arr[i + offsetX][j + offsetY] = shapeNum;
                                break;
                            }
                            else {
                                changeX = 0;
                                changeY = 0;
                                direc++;
                                if (direc = 4) {
                                    direc = 0;
                                }
                                direcCount++;
                            }
                        } while(changeX == 0 && changeY == 0 && direcCount < 4);

                        shapeCount++;
                    }
                    count++;
                }
            }
        }

        this.data = arr;

        this.setFood();

        return {
            tiles: this.generateTiles(),
            width: this.width,
            height: this.height
        };

        /*
        for (var i = -13 ; i <= 13 ; i++) {
            var str = "";
            for (var j = -13 ; j <= 13 ; j++) {
                if (arr[i][j] === undefined) {
                    arr[i][j] = -1;
                }
                var addStr = arr[i][j] + "";
                while (addStr.length < 3) {
                    addStr += " ";
                }
                str += addStr;
            }
            console.log(str);
        }
        */
    },
    generateTiles: function() {
        var data = this.data;
        for (var i = 0 ; i < data.length - 1 ; i++) {
            for (var j = 0 ; j < data[i].length - 1; j++) {
                var walls = [false, false, false, false];
                if (data[i][j] == data[i+1][j] && data[i][j] !== null && data[i+1][j] !== null) {
                    walls[0] = true;
                }
                if (data[i][j] == data[i][j+1] && data[i][j] !== null && data[i][j+1] !== null) {
                    walls[1] = true;
                }
                if (data[i][j+1] == data[i+1][j+1] && data[i][j+1] !== null && data[i+1][j+1] !== null) {
                    walls[2] = true;
                }
                if (data[i+1][j] == data[i+1][j+1] && data[i+1][j] !== null && data[i+1][j+1] !== null) {
                    walls[3] = true;
                }

                this.tiles.push({
                    x: i,
                    y: j,
                    walls: walls
                });
            }
        }

        return this.tiles;
    },
    getFoodData: function() {
        var totalSpace = 0;
        var totalFood1 = 0;
        var powerupPlaced = false;
        for (var i = 0 ; i < this.food.length ; i++) {
            for (var j = 0 ; j < this.food[i].length ; j++) {
                if (this.food[i][j] == 1) {
                    totalFood1++;
                }
                else if (this.food[i][j] == 2) {
                    powerupPlaced = true;
                }

                totalSpace++;
            }
        }

        return {
            percentage: totalFood1 / totalSpace,
            powerupPlaced: powerupPlaced
        };
    },
    setFood: function() {
        var powerupUsed = false;
        for (var i = this.foodBorder ; i < this.width - this.foodBorder ; i++) {
            for (var j = this.foodBorder ; j < this.height - this.foodBorder ; j++) {
                if (Math.random() <= this.foodChance) {
                    this.food[i][j] = 1;
                }
            }
        }
    },
    addFood: function() {
        var i = 0;
        var j = 0;
        do {
            i = this.getRandomIntInclusive(0, this.food.length - 1);
            j = this.getRandomIntInclusive(0, this.food[i].length - 1);
        } while(this.food[i][j] != 0);

        var powerupAllowed = !this.getFoodData().powerupPlaced;
        if (powerupAllowed && Math.random() < .01) {
            this.food[i][j] = 2;
        }
        else {
            this.food[i][j] = 1;
        }

        return {
            type: this.food[i][j],
            x: i,
            y: j
        };
    },
    collideFood: function(x, y) {
        var range = 20;
        var i = Math.round(x / this.tileSize);
        var j = Math.round(y / this.tileSize);
        var foodX = i * this.tileSize;
        var foodY = j * this.tileSize;
        var foodType = this.food[i][j];
        if (foodType != 0 && Math.abs(x - foodX) <= range && Math.abs(y - foodY) <= range) {
            return {
                type: foodType,
                x: i,
                y: j
            };
        }
        return false;
    },
    checkCollision: function(initialX, initialY, finalX, finalY, dt) {

        var maxSpeed = 10;

        var difX = finalX - initialX;
        var difY = finalY - initialY;

        if (Math.abs(difX) > maxSpeed || Math.abs(difY) > maxSpeed) {
            
            return false;
        }

        // if (Math.abs(difX) > Math.abs(difY)) {
        //     if (difX > 0) {
        //         direction = 3;
        //     }
        //     else {
        //         direction = 1;
        //     }
        // }
        // else if (Math.abs(difX) < Math.abs(difY)) {
        //     if (difY > 0) {
        //         direction = 2;
        //     }
        //     else {
        //         direction = 0;
        //     }
        // }
        // else if (difX == 0 && difY == 0) {
        //     return true;
        // }
        // else {
        //     return false;
        // }

        var scaledX = finalX / this.tileSize;
        var scaledY = finalY / this.tileSize;
        var initialTileX = Math.round(initialX / this.tileSize);
        var initialTileY = Math.round(initialY / this.tileSize);
        var finalTileX = Math.round(finalX / this.tileSize);
        var finalTileY = Math.round(finalY / this.tileSize);
        // var tilePath = [];
        // if (direction == 0 || direction == 2) {
        //     for (var i = 0 ; i <= Math.abs(initialTileY - finalTileY) ; i++) {
        //         var change = (direction == 0 ? -1 : 1) * i;
        //         tilePath.push({x: initialTileX, y: initialTileY + change});
        //     }
        // }
        // else {
        //     for (var i = 0 ; i <= Math.abs(initialTileX - finalTileX) ; i++) {
        //         var change = (direction == 1 ? -1 : 1) * i;
        //         tilePath.push({x: initialTileX + change, y: initialTileY});
        //     }
        // }

        var threshold = 0;

        // for (var t = 0 ; t < tilePath.length - 1 ; t++) {
        //     for (var i = 0 ; i < this.tiles.length ; i++) {
        //         var tile = this.tiles[i];
        //         var tileX = tilePath[t].x;
        //         var tileY = tilePath[t].y;
        //         if (tileX == tile.x && tileY == tile.y) {
        //             var wall = tile.walls[direction];
        //             if (wall) {
        //                 return false;
        //             }
        //         }
        //     }
        // }

        for (var i = 0 ; i < this.tiles.length ; i++) {
            var tile = this.tiles[i];
            var tileX = finalTileX;
            var tileY = finalTileY;
            if (tileX == tile.x && tileY == tile.y) {

                if (scaledX == tileX || scaledY == tileY) {
                }
                else {
                    return false;
                }
                
                var worked = false;
                if (tile.walls[0] && scaledY < tileY - threshold) {
                    return false;
                }
                else if (tile.walls[2] && scaledY > tileY + threshold) {
                    return false;
                }
                else if (tile.walls[1] && scaledX < tileX - threshold) {
                    return false;
                }
                else if (tile.walls[3] && scaledX > tileX + threshold) {
                    return false;
                }
                else {
                    return true;
                }
            }
        }

        return false;
    },
    getRandomIntInclusive: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
      }
};