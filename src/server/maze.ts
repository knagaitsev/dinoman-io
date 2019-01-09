import * as SimplexNoise from 'simplex-noise'
import { RoaringBitmap32 } from 'roaring';

export default class Maze {
    simplex: SimplexNoise;
    data: any; //FIXME:  asd
    tiles: any[];
    tileSize: number;
    width: number;
    height: number;
    mainBounds: number;
    foodBorder: number;
    food: RoaringBitmap32;
    power: RoaringBitmap32;
    foodChance: number;
    size: any;

    constructor() {
        this.simplex = new SimplexNoise("seed");

        this.data = null;

        this.tiles = [];

        this.tileSize = 100;
        
        this.width = 60;
        this.height = 60;
        this.mainBounds = 10;
        this.foodBorder = 11;

        this.foodChance = 0.3;

        // for (var i = 0 ; i < this.width ; i++) {
            this.food = new RoaringBitmap32();
            this.power = new RoaringBitmap32();
        // }
    }

    generate() {
        var arr = [];

        var size = this.size;

        for (var i = 0 ; i < this.width ; i++) {
            arr[i] = new Array(this.height).fill(-1);
        }

        var tileIndices = this.getTileIndices();
        var center = {
            x: Math.round(this.width / 2),
            y: Math.round(this.height / 2)
        };
        var self = this;
        tileIndices.sort(function(p1, p2) {
            if (self.distance2(p1, center) <= self.distance2(p2, center)) {
                return -1;
            }
            return 1;
        });

        var count = 0;
        var bounds = this.mainBounds;
        for (var p = 0 ; p < tileIndices.length ; p++) {
            var i = tileIndices[p].x;
            var j = tileIndices[p].y;

            if (arr[i] === undefined) {
                arr[i] = [];
            }

            if (arr[i][j] === undefined || arr[i][j] == -1) {
                var shapeNum = count;
                arr[i][j] = shapeNum;
                var shapeCount = 0;
                var offsetX = 0;
                var offsetY = 0;
                var pastOffsets = [];
                var max = this.getRandomIntInclusive(4,8);
                while (shapeCount < max) {

                    // if (pastOffsets.length > 0) {
                    //     var offsetObj = pastOffsets[this.getRandomIntInclusive(0, pastOffsets.length - 1)];
                    //     offsetX = offsetObj.x;
                    //     offsetY = offsetObj.y;
                    // }
                    
                    //var direcChoice = this.simplex.noise2D(i + offsetX, j + offsetY);
                    //var direc = Math.floor((direcChoice + 1) * 2);
                    var direc = this.getRandomIntInclusive(0, 3);
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
                            if (direc == 4) {
                                direc = 0;
                            }
                            direcCount++;
                        }
                    } while(changeX == 0 && changeY == 0 && direcCount < 4);

                    shapeCount++;

                    pastOffsets.push({
                        x: offsetX,
                        y: offsetY
                    });
                }
                count++;
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
    }

    generateTiles() {
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

        this.checkTiles();

        return this.tiles;
    }

    getTile(x: number, y: number) : any {
        for (var i = 0 ; i < this.tiles.length ; i++) {
            if (this.tiles[i].x == x && this.tiles[i].y == y) {
                return this.tiles[i];
            }
        }
    }

    getTileIndices() {
        var minX = this.mainBounds;
        var maxX = this.width - this.mainBounds - 1;
        var minY = this.mainBounds;
        var maxY = this.height - this.mainBounds - 1;

        var arr = [];
        for (var i = minX ; i <= maxX ; i++) {
            for (var j = minY ; j <= maxY ; j++) {
                arr.push({
                    x: i,
                    y: j
                });
            }
        }

        return arr;
    }

    getTilePositions() {
        var minX = this.mainBounds;
        var maxX = this.width - this.mainBounds - 1;
        var minY = this.mainBounds;
        var maxY = this.height - this.mainBounds - 1;

        var arr = [];
        for (var i = minX ; i <= maxX ; i++) {
            for (var j = minY ; j <= maxY ; j++) {
                if (this.getTile(i, j)) {
                    arr.push({
                        x: i * this.tileSize,
                        y: j * this.tileSize
                    });
                }
            }
        }

        return arr;
    }

    checkTiles() {
        var minX = this.mainBounds;
        var maxX = this.width - this.mainBounds - 1;
        var minY = this.mainBounds;
        var maxY = this.height - this.mainBounds - 1;
        var bounds = {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        };
        var badTiles = [];
        while(true) {
            this.resetTileCheck(bounds);
            this.checkTileRecursive(minX, minY, bounds);
            badTiles = this.getBadTiles(bounds);
            if (badTiles.length == 0) {
                break;
            }
            var randomTile = 0;
            var randDirec = 0;
            var neighbor = null;
            do {
                randomTile = this.getRandomIntInclusive(0, badTiles.length - 1);
                var randDirec = this.getRandomIntInclusive(0, 3);
                neighbor = this.getNeighbor(badTiles[randomTile], randDirec);
            } while (!neighbor.checked || neighbor.x < minX || neighbor.x > maxX || neighbor.y < minY || neighbor.y > maxY);
            this.removeWall(badTiles[randomTile], randDirec);
        }
    }

    getBadTiles(bounds: any) {
        var badTiles = [];
        for (var i = bounds.minX ; i <= bounds.maxX ; i++) {
            for (var j = bounds.minY ; j <= bounds.maxY ; j++) {
                var tile = this.getTile(i, j);
                if (!tile.checked) {
                    badTiles.push(tile);
                }
            }
        }

        return badTiles;
    }
    
    resetTileCheck(bounds: any) {
        for (var i = bounds.minX ; i <= bounds.maxX ; i++) {
            for (var j = bounds.minY ; j <= bounds.maxY ; j++) {
                var tile = this.getTile(i, j);
                tile.checked = false;
            }
        }
    }

    checkTileRecursive(x: number, y: number, bounds: any) {
        var tile = this.getTile(x, y);
        tile.checked = true;
        if (x != bounds.minX && !tile.walls[1] && !this.getTile(x - 1, y).checked) {
            this.checkTileRecursive(x - 1, y, bounds);
        }
        if (x != bounds.maxX && !tile.walls[3] && !this.getTile(x + 1, y).checked) {
            this.checkTileRecursive(x + 1, y, bounds);
        }
        if (y != bounds.minY && !tile.walls[0] && !this.getTile(x, y - 1).checked) {
            this.checkTileRecursive(x, y - 1, bounds);
        }
        if (y != bounds.maxY && !tile.walls[2] && !this.getTile(x, y + 1).checked) {
            this.checkTileRecursive(x, y + 1, bounds);
        }
    }

    tileBoxedIn(tile: any) {
        for (var i = 0 ; i < tile.walls.length ; i++) {
            if (!tile.walls[i]) {
                return false;
            }
        }

        return true;
    }

    getNeighbor(tile: any, direction: number) {
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
    }

    removeWall(tile: any, direction: any) {
        tile.walls[direction] = false;
        this.getNeighbor(tile, direction).walls[(direction + 2) % 4] = false;
    }

    setFood() {
        const iterations = (this.width - 2 * this.foodBorder) * (this.height - 2 * this.foodBorder) * (0.3 + Math.random() * 0.3) ; 
        for (let i = 0; i < iterations; i++) {
            this.food.add(this.randomPosition());
        }
    }

    randomPosition() {
        return Math.floor(Math.random() * (this.width - 2 * this.foodBorder + 1) + this.foodBorder) +  Math.floor(Math.random() * (this.height - 2 * this.foodBorder + 1) + this.foodBorder) * this.height;
    }

    addFood(playerCount: number) {
        let nextPosition;
        do {
            nextPosition = this.randomPosition();
        } while(this.food.has(nextPosition) || this.power.has(nextPosition));


        var powerupAllowed = false;
        const totalSpace = (this.width - 2 * this.foodBorder + 1) * (this.height - 2 * this.foodBorder + 1);
        if (playerCount <= 2) {
            powerupAllowed = this.power.statistics().size < Math.ceil(totalSpace / 360);
        }
        else if (playerCount <= 4) {
            powerupAllowed = this.power.statistics().size < Math.ceil(totalSpace / 900);
        }
        else {
            powerupAllowed = this.power.statistics().size == 0 && Math.random() < 0.02;
        }

        if (powerupAllowed) {
            this.power.add(nextPosition);
            return {
                flattenPosition: nextPosition,
                type : 2
            }
        }
        else {
            this.food.add(nextPosition);
            return {
                flattenPosition: nextPosition,
                type : 1
            }
        }
    }

    collideFood(x: number, y: number) {
        var i = Math.round(x / this.tileSize);
        var j = Math.round(y / this.tileSize);

        const flattenPosition = i + j * this.width;

        if (this.food.delete(flattenPosition)) {
            return {
                flattenPosition,
                type: 1
            }
        } else if(this.power.delete(flattenPosition)) {
            return {
                flattenPosition,
                type: 2
            }
        }
        
        return false;
    }

    checkCollision(initialX: number, initialY: number, finalX: number, finalY: number, dt: number, nickname: string) {

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
                    console.log(nickname + " kicked for not staying in maze path");
                    return false;
                }
                
                var worked = false;
                if (tile.walls[0] && scaledY < tileY - threshold) {
                    console.log(nickname + " kicked for clipping wall 0");
                    return false;
                }
                else if (tile.walls[2] && scaledY > tileY + threshold) {
                    console.log(nickname + " kicked for clipping wall 2");
                    return false;
                }
                else if (tile.walls[1] && scaledX < tileX - threshold) {
                    console.log(nickname + " kicked for clipping wall 1");
                    return false;
                }
                else if (tile.walls[3] && scaledX > tileX + threshold) {
                    console.log(nickname + " kicked for clipping wall 3");
                    return false;
                }
                else {
                    return true;
                }
            }
        }

        return false;
    }

    getRandomIntInclusive(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
    }

    distance2(p1: any, p2: any) {
        var d1 = p1.x - p2.x;
        var d2 = p1.y - p2.y;
        return d1 * d1 + d2 * d2;
    }
};