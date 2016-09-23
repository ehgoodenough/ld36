import config from "config.js"
var WORLD_BORDER_WIDTH = 3

export default class Cartographer {
    constructor(){
        this.canvas = document.getElementById("myCanvas")
        this.ctx = this.canvas.getContext("2d")
        this.ctx.fillStyle = "#000"
        this.tiles = null
        this.image = null
        this.minTX = 0
        this.minTY = 0
        this.tx = null
        this.ty = null
    }
    createMap(gameTiles){
        this.getTiles(gameTiles)
        this.setCanvasDimensions()
        this.drawTiles()
        this.createImage()
        this.determineCornerPosition()
    }
    getTiles(gameTiles){
        this.tiles = gameTiles
    }
    setCanvasDimensions(){
        var minimumTX = 0
        var minimumTY = 0
        var maximumTX = 0
        var maximumTY = 0
        this.tiles.children.forEach((tile) => {
            if(tile.tx < minimumTX){
                minimumTX = tile.tx
            }
            if(tile.ty < minimumTY){
                minimumTY = tile.ty
            }
            if(tile.tx > maximumTX){
                maximumTX = tile.tx + 1
            }
            if(tile.ty > maximumTY){
                maximumTY = tile.ty + 1
            }
        })
        var twidth = maximumTX - minimumTX
        var theight = maximumTY - minimumTY
        this.canvas.width = (twidth + WORLD_BORDER_WIDTH * 2)*config.tile.size
        this.canvas.height = (theight + WORLD_BORDER_WIDTH *2 )*config.tile.size
        this.minTX = minimumTX
        this.minTY = minimumTY
    }
    drawTiles(){
        this.tiles.children.forEach((tile) => {
            var xOffset = (0-(this.minTX - WORLD_BORDER_WIDTH))*config.tile.size
            var yOffset = (0-(this.minTY - WORLD_BORDER_WIDTH))*config.tile.size
            var pixelX = tile.tx*config.tile.size + xOffset
            var pixelY = tile.ty*config.tile.size + yOffset
            var pixelWidth = config.tile.size
            var pixelHeight = config.tile.size
            this.ctx.rect(pixelX,pixelY,pixelWidth,pixelHeight)
            this.ctx.fill()
        })
    }
    createImage(){
        var image = document.createElement("img")
        var imageSrc = this.canvas.toDataURL("image/png")
        image.src = imageSrc
        document.body.appendChild(image)
    }
    determineCornerPosition(){
        this.tx = this.minTX - WORLD_BORDER_WIDTH
        this.ty = this.minTY - WORLD_BORDER_WIDTH
        console.log(this.tx)
        console.log(this.ty)
    }
}