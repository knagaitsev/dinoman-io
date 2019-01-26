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

        // for (let i = 0 ; i < this.width ; i++) {
            this.food = new RoaringBitmap32();
            this.power = new RoaringBitmap32();
        // }
    }

    generate() {
        let arr = [];

        let size = this.size;

        for (let i = 0 ; i < this.width ; i++) {
            arr[i] = new Array(this.height).fill(-1);
        }

        let tileIndices = this.getTileIndices();
        let center = {
            x: Math.round(this.width / 2),
            y: Math.round(this.height / 2)
        };
        let self = this;
        tileIndices.sort(function(p1, p2) {
            if (self.distance2(p1, center) <= self.distance2(p2, center)) {
                return -1;
            }
            return 1;
        });

        let count = 0;
        let bounds = this.mainBounds;
        for (let p = 0 ; p < tileIndices.length ; p++) {
            let i = tileIndices[p].x;
            let j = tileIndices[p].y;

            if (arr[i] === undefined) {
                arr[i] = [];
            }

            if (arr[i][j] === undefined || arr[i][j] == -1) {
                let shapeNum = count;
                arr[i][j] = shapeNum;
                let shapeCount = 0;
                let offsetX = 0;
                let offsetY = 0;
                let pastOffsets = [];
                let max = this.getRandomIntInclusive(4,8);
                while (shapeCount < max) {

                    // if (pastOffsets.length > 0) {
                    //     let offsetObj = pastOffsets[this.getRandomIntInclusive(0, pastOffsets.length - 1)];
                    //     offsetX = offsetObj.x;
                    //     offsetY = offsetObj.y;
                    // }
                    
                    //let direcChoice = this.simplex.noise2D(i + offsetX, j + offsetY);
                    //let direc = Math.floor((direcChoice + 1) * 2);
                    let direc = this.getRandomIntInclusive(0, 3);
                    let changeX = 0;
                    let changeY = 0;
                    let direcCount = 0;
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
                        
                        let elem = arr[i + offsetX + changeX][j + offsetY + changeY];
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
        for (let i = -13 ; i <= 13 ; i++) {
            let str = "";
            for (let j = -13 ; j <= 13 ; j++) {
                if (arr[i][j] === undefined) {
                    arr[i][j] = -1;
                }
                let addStr = arr[i][j] + "";
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
        let data = this.data;
        for (let i = 0 ; i < data.length - 1 ; i++) {
            for (let j = 0 ; j < data[i].length - 1; j++) {
                let walls = [false, false, false, false];
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
        for (let i = 0 ; i < this.tiles.length ; i++) {
            if (this.tiles[i].x == x && this.tiles[i].y == y) {
                return this.tiles[i];
            }
        }
    }

    getTileIndices() {
        let minX = this.mainBounds;
        let maxX = this.width - this.mainBounds - 1;
        let minY = this.mainBounds;
        let maxY = this.height - this.mainBounds - 1;

        let arr = [];
        for (let i = minX ; i <= maxX ; i++) {
            for (let j = minY ; j <= maxY ; j++) {
                arr.push({
                    x: i,
                    y: j
                });
            }
        }

        return arr;
    }

    getTilePositions() {
        let minX = this.mainBounds;
        let maxX = this.width - this.mainBounds - 1;
        let minY = this.mainBounds;
        let maxY = this.height - this.mainBounds - 1;

        let arr = [];
        for (let i = minX ; i <= maxX ; i++) {
            for (let j = minY ; j <= maxY ; j++) {
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
        let minX = this.mainBounds;
        let maxX = this.width - this.mainBounds - 1;
        let minY = this.mainBounds;
        let maxY = this.height - this.mainBounds - 1;
        let bounds = {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        };
        let badTiles = [];
        while(true) {
            this.resetTileCheck(bounds);
            this.checkTileRecursive(minX, minY, bounds);
            badTiles = this.getBadTiles(bounds);
            if (badTiles.length == 0) {
                break;
            }
            let randomTile = 0;
            let randDirec = 0;
            let neighbor = null;
            do {
                randomTile = this.getRandomIntInclusive(0, badTiles.length - 1);
                let randDirec = this.getRandomIntInclusive(0, 3);
                neighbor = this.getNeighbor(badTiles[randomTile], randDirec);
            } while (!neighbor.checked || neighbor.x < minX || neighbor.x > maxX || neighbor.y < minY || neighbor.y > maxY);
            this.removeWall(badTiles[randomTile], randDirec);
        }
    }

    getBadTiles(bounds: any) {
        let badTiles = [];
        for (let i = bounds.minX ; i <= bounds.maxX ; i++) {
            for (let j = bounds.minY ; j <= bounds.maxY ; j++) {
                let tile = this.getTile(i, j);
                if (!tile.checked) {
                    badTiles.push(tile);
                }
            }
        }

        return badTiles;
    }
    
    resetTileCheck(bounds: any) {
        for (let i = bounds.minX ; i <= bounds.maxX ; i++) {
            for (let j = bounds.minY ; j <= bounds.maxY ; j++) {
                let tile = this.getTile(i, j);
                tile.checked = false;
            }
        }
    }

    checkTileRecursive(x: number, y: number, bounds: any) {
        let tile = this.getTile(x, y);
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
        for (let i = 0 ; i < tile.walls.length ; i++) {
            if (!tile.walls[i]) {
                return false;
            }
        }

        return true;
    }

    getNeighbor(tile: any, direction: number) {
        let x = tile.x;
        let y = tile.y;
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


        let powerupAllowed = false;
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
        let i = Math.round(x / this.tileSize);
        let j = Math.round(y / this.tileSize);

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

        let scaledX = finalX / this.tileSize;
        let scaledY = finalY / this.tileSize;
        let initialTileX = Math.round(initialX / this.tileSize);
        let initialTileY = Math.round(initialY / this.tileSize);
        let finalTileX = Math.round(finalX / this.tileSize);
        let finalTileY = Math.round(finalY / this.tileSize);
        // let tilePath = [];
        // if (direction == 0 || direction == 2) {
        //     for (let i = 0 ; i <= Math.abs(initialTileY - finalTileY) ; i++) {
        //         let change = (direction == 0 ? -1 : 1) * i;
        //         tilePath.push({x: initialTileX, y: initialTileY + change});
        //     }
        // }
        // else {
        //     for (let i = 0 ; i <= Math.abs(initialTileX - finalTileX) ; i++) {
        //         let change = (direction == 1 ? -1 : 1) * i;
        //         tilePath.push({x: initialTileX + change, y: initialTileY});
        //     }
        // }

        let threshold = 0;

        // for (let t = 0 ; t < tilePath.length - 1 ; t++) {
        //     for (let i = 0 ; i < this.tiles.length ; i++) {
        //         let tile = this.tiles[i];
        //         let tileX = tilePath[t].x;
        //         let tileY = tilePath[t].y;
        //         if (tileX == tile.x && tileY == tile.y) {
        //             let wall = tile.walls[direction];
        //             if (wall) {
        //                 return false;
        //             }
        //         }
        //     }
        // }

        for (let i = 0 ; i < this.tiles.length ; i++) {
            let tile = this.tiles[i];
            let tileX = finalTileX;
            let tileY = finalTileY;
            if (tileX == tile.x && tileY == tile.y) {

                if (scaledX == tileX || scaledY == tileY) {
                }
                else {
                    console.log(nickname + " kicked for not staying in maze path");
                    return false;
                }
                
                let worked = false;
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
        let d1 = p1.x - p2.x;
        let d2 = p1.y - p2.y;
        return d1 * d1 + d2 * d2;
    }
};