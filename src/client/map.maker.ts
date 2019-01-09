import Game from './game';
import { Map as MapProto } from '../shared/map_pb';
import { Tail } from '../shared/tail_pb';
import * as  FastBitSet from 'fastbitset';
import { Extra } from '../shared/extra_pb';

interface Tile {

}

export default class MapMaker {

    private tiles : Tail.AsObject[];
    private size : number;
    initialized : boolean;
    private number : number;
    width: number;
    height: number;
    food: FastBitSet;
    power: FastBitSet;
    foodSprites: Map<number, any>;
    canvases: any[];
    canvassize: number;
    
    constructor(private readonly game: Game) {
        this.tiles = null;
        this.size = 100;
        this.initialized = false;

        this.width = 0;
        this.height = 0;
        this.food = new FastBitSet([]);
        this.power = new FastBitSet([]);
        this.foodSprites = new Map();

        this.canvases = [];

        this.canvassize = 16;
    }

    static ceilPow2(aSize: any) {
        return Math.pow( 2, Math.ceil( Math.log( aSize ) / Math.log( 2 ) ) ); 
    }

    public tileDataMatches(oldData: any, newData: any) {
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
    }

    public addTiles(data: MapProto.AsObject, oldData?:any) {

        this.width = data.size.width;
        this.height = data.size.height;

        var tiles = data.tailsList;
        this.tiles = tiles;
        this.initialized = true;

        if (this.tileDataMatches(oldData, data) && this.canvases.length > 0) {
            // for (var i = 0 ; i < this.canvases.length ; i++) {
            //     var c = this.canvases[i];
            //     this.game.add.image(c.x, c.y, c.name).setOrigin(0);
            // }
            //this.game.add.image(-this.size / 2, -this.size / 2, 'map').setOrigin(0);
            return;
        }
        else if (this.canvases.length > 0) {
            for (var i = 0 ; i < this.canvases.length ; i++) {
                this.game.textures.remove(this.canvases[i].name);
            }
        }

        this.canvases = [];

        var interval = this.canvassize;

        var count = 0;


        for (var x = 0 ; x < data.size.width ; x += interval) {
            for (var y = 0 ; y < data.size.height ; y += interval) {

                var width = Math.min(interval, data.size.width - x);
                var height = Math.min(interval, data.size.height - y);
                var canvasName = 'map' + count;
                var canvasTexture = this.game.textures.createCanvas(canvasName, width * this.size, height * this.size);
                var context = canvasTexture.context;
                var texture = this.game.textures.get('tiles');

                for (var i = x ; i < x + width ; i++) {
                    for (var j = y ; j < y + height ; j++) {
                        var walls: boolean[];
                        for (var t = 0 ; t < tiles.length ; t++) {
                            if (tiles[t].point.x == i && tiles[t].point.y == j) {
                                walls = tiles[t].wallsList;
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
                            var contextX = i - x;
                            var contextY = j - y;
                            
                            context.save();
                            context.translate(contextX * this.size + this.size / 2, contextY * this.size + this.size / 2);
                            context.rotate(Phaser.Math.DegToRad(rotation));
        
                            var canvasData = (texture.frames as any)[frame].canvasData;
                            context.drawImage(texture.getSourceImage() as HTMLCanvasElement, canvasData.x, canvasData.y,
                                canvasData.width, canvasData.height, -this.size / 2, -this.size / 2, this.size, this.size);
                            context.restore();

                            //sheet.setFrame(frame);
                            //sheet.setRotation(Phaser.Math.DegToRad(rotation));
                        }
                    }
                }

                canvasTexture.refresh();
        
                var posX = -this.size / 2 + x * this.size;
                var posY = -this.size / 2 + y * this.size;
                //this.game.add.image(posX, posY, canvasName).setOrigin(0);

                this.canvases.push({
                    x: posX,
                    y: posY,
                    name: canvasName,
                    image: null
                });

                count++;
            }
        }

        // var canvasTexture = this.game.textures.createCanvas('map', this.ceilPow2(data.width * this.size), this.ceilPow2(data.height * this.size));
        // var context = canvasTexture.context;
        // var texture = this.game.textures.get('tiles');

        // for (var i = 0 ; i < data.width ; i++) {
        //     for (var j = 0 ; j < data.height ; j++) {
        //         var walls;
        //         for (var t = 0 ; t < tiles.length ; t++) {
        //             if (tiles[t].x == i && tiles[t].y == j) {
        //                 walls = tiles[t].walls;
        //                 break;
        //             }
        //         }

        //         var frame = -1;
        //         var rotation = 0;

        //         var wallCount = 0;
        //         for (var w = 0 ; w < walls.length ; w++) {
        //             if (walls[w]) {
        //                 wallCount++;
        //             }
        //         }

        //         if (wallCount == 0) {
        //             frame = 6;
        //         }
        //         else if (wallCount == 4) {
        //             frame = 9;
        //         }
        //         else if (wallCount == 3) {
        //             frame = 4;
        //             for (var w = 0 ; w < walls.length ; w++) {
        //                 var wall = walls[w];
        //                 if (!wall) {
        //                     rotation = 180 - 90 * w;
        //                 }
        //             }
        //         }
        //         else if (wallCount == 2) {
        //             if (walls[0] == walls[2]) {
        //                 frame = 13;
        //                 if (walls[0]) {
        //                     rotation = 90;
        //                 }
        //             }
        //             else {
        //                 frame = 8;
        //                 for (var w = 0 ; w < walls.length ; w++) {
        //                     var wall1 = walls[w];
        //                     var wall2;
        //                     if (w == walls.length - 1) {
        //                         wall2 = walls[0];
        //                     }
        //                     else {
        //                         wall2 = walls[w+1]
        //                     }
    
        //                     if (wall1 == wall2 && wall1) {
        //                         rotation = -90 * w;
        //                     }
        //                 }
        //             }
        //         }
        //         else if (wallCount == 1) {
        //             frame = 12;
        //             for (var w = 0 ; w < walls.length ; w++) {
        //                 var wall = walls[w];
        //                 if (wall) {
        //                     rotation = 90 - (w * 90);
        //                     break;
        //                 }
        //             }
        //         }

        //         if (frame != -1) {
        //             context.save();
        //             context.translate(i * this.size + this.size / 2, j * this.size + this.size / 2);
        //             context.rotate(Phaser.Math.DegToRad(rotation));

        //             var canvasData = texture.frames[frame].canvasData;
        //             context.drawImage(texture.getSourceImage(), canvasData.sx, canvasData.sy,
        //                 canvasData.sWidth, canvasData.sHeight, -this.size / 2, -this.size / 2, this.size, this.size);
        //             //var sheet = this.game.physics.add.sprite(i * this.size, j * this.size, 'tiles').setScale(0.5);
        //             context.restore();
        //             //sheet.setFrame(frame);
        //             //sheet.setRotation(Phaser.Math.DegToRad(rotation));
        //         }
        //     }
        // }

        // canvasTexture.refresh();
        // this.game.add.image(-this.size / 2, -this.size / 2, 'map').setOrigin(0);

    }

    public getTile(x:any, y:any) {
        for (var i = 0 ; i < this.tiles.length ; i++) {
            if (this.tiles[i].point.x == x && this.tiles[i].point.y == y) {
                return this.tiles[i];
            }
        }

        return false;
    }

    getNeighbor(tile: any, direction: any) {
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

    updateTiles(x:any, y:any) {
        var canvasWidth = this.canvassize * this.size;
        for (var i = 0 ; i < this.canvases.length ; i++) {
            var c = this.canvases[i];
            var centerX = c.x + canvasWidth / 2 + this.size / 2;
            var centerY = c.y + canvasWidth / 2 + this.size / 2;
            if (Math.abs(x - centerX) <= this.game.sizeData.width / 2 / this.game.sizeData.scale + 50 + canvasWidth / 2 && Math.abs(y - centerY) <= this.game.sizeData.height / 2 / this.game.sizeData.scale + 50 + canvasWidth / 2) {
                if (!c.image) {
                    c.image = this.game.add.image(c.x, c.y, c.name).setOrigin(0).setScale(this.game.sizeData.scale);
                    //console.log(c.image);
                    this.game.children.sendToBack(c.image);
                }
            }
            else if (c.image) {
                c.image.destroy();
                c.image = null;
            }
        }
    }
    setFood() {
        // for (var f = this.foodSprites.length - 1 ; f >= 0 ; f--) {
        //     var foodSprite = this.foodSprites[f];
        //     var i = Math.round(foodSprite.x / this.size);
        //     var j = Math.round(foodSprite.y / this.size);
        //     if (Math.abs(foodSprite.x - x) > xRange || Math.abs(foodSprite.y - y) > yRange || (i < this.food.length && j < this.food[i].length && (this.food[i][j] == 0 || (this.food[i][j] != foodSprite.foodType)))) {
        //         foodSprite.destroy();
        //         this.foodSprites.splice(f, 1);
        //     }
        // }

        // for (var i = 0 ; i < this.width ; i++) {
            // for (var j = 0 ; j < this.height ; j++) {
        this.food.forEach(next => this.insertFood(next));

        this.power.forEach(next => this.insertPower(next));
    }

    retainExtra(last: number) {
        if (this.food.has(last)) {
            console.log('retained food : ' + last);
            this.food.remove(last);
        } else {
            console.log('retained power : ' + last);
            this.power.remove(last); 
        }

        this.foodSprites.get(last).destroy();
        this.foodSprites.delete(last);
    }

    insertFood(next: number) {
        const i = next % this.width;
        const j = Math.floor(next / this.width);
        const foodSprite = this.game.physics.add.sprite(
            i * this.size,
            j * this.size, 
            'food1'
        ).setScale(this.game.sizeData.scale);
        // (foodSprite as any).foodType = 1;
        this.foodSprites.set(next, foodSprite);
    }

    insertPower(next: number) {
        const i = next % this.width;
        const j = Math.floor(next / this.width);
        const foodSprite = this.game.physics.add.sprite(
            i * this.size,
            j * this.size, 
            'food2'
        ).setScale(this.game.sizeData.scale);
        // (foodSprite as any).foodType = 1;
        this.foodSprites.set(next, foodSprite);
    }

    checkCollision(initialX: number, initialY: number, finalX: number, finalY: number, direction: number, newDirection:any, regVec: { x: number; y: number; }, forceTurn?:any) {

        // return {
        //     x: finalX,
        //     y: finalY,
        //     success: true
        // };

        var scaledX = finalX / this.size;
        var scaledY = finalY / this.size;
        var initialTileX = Math.round(initialX / this.size);
        var initialTileY = Math.round(initialY / this.size);
        var finalTileX = Math.round(finalX / this.size);
        var finalTileY = Math.round(finalY / this.size);
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
                if (tileX == tile.point.x && tileY == tile.point.y) {
                    var wall = tile.wallsList[direction];
                    if (wall) {
                        if (direction == 0 || direction == 2) {
                            return {
                                x: initialX,
                                y: tileY * this.size,
                                //y: (direction == 0 ? tileY - threshold : tileY + threshold) * this.size,
                                success: false
                            };
                        }
                        else {
                            return {
                                //x: (direction == 1 ? tileX - threshold : tileX + threshold) * this.size,
                                x: tileX * this.size,
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
            if (tileX == tile.point.x && tileY == tile.point.y) {
                var wall = tile.wallsList[direction];

                var initX = initialX / this.size;
                var initY = initialY / this.size;

                var hypX = (initialX + regVec.x) / this.size;
                var hypY = (initialY + regVec.y) / this.size;
                
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
                else if (forceTurn) {
                    worked = true;
                }
                else {
                    worked = false;
                }

                if (worked) {
                    if (direction == 0 || direction == 2) {
                        return {x: tileX * this.size, y: finalY, success: !wall || tilePath.length > 1};
                    }
                    else {
                        return {x: finalX, y: tileY * this.size, success: !wall || tilePath.length > 1};
                    }
                }
                else {
                    var success = tilePath.length > 1;
                    if (direction == 0 || direction == 2) {
                        return {
                            x: initialX,
                            y: tileY * this.size,
                            //y: (direction == 0 ? tileY - threshold : tileY + threshold) * this.size,
                            success: success
                        };
                    }
                    else {
                        return {
                            x: tileX * this.size,
                            //x: (direction == 1 ? tileX - threshold : tileX + threshold) * this.size,
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
    
    shutdown() {
        this.food.clear();
        this.power.clear();
        this.foodSprites = new Map();
        for (var i = 0 ; i < this.canvases.length ; i++) {
            if (this.canvases[i].image) {
                this.canvases[i].image = null;
            }
        }
    }
};