import Pixi from "pixi.js"
import Geometry from "scripts/utility/Geometry.js"
import Sound from "scripts/utility/Sound.js"

import config from "config.js"

var SPEAR_TEXTURE = Pixi.Texture.fromImage(require("images/spear.png"))
var WALL_HIT_SOUND = new Sound(require("sounds/wallhit.mp3"))
// The raycast's resolution
var NUMBER_OF_COLLISION_SAMPLES = 8
// The pixel location, relative to center, of the weapon at its handle
var WEAPON_TILT_OFFSET = -6
// The weapon's tile size plus half the player's tile size
var WEAPON_RANGE = 1.5
export default class Spear extends Pixi.Sprite {
    constructor(spear) {
        super(SPEAR_TEXTURE)
        this.position.x = spear.x
        this.position.y = spear.y
        this.anchor.y = 0.5
        this.anchor.x = 0.5
        this.sampleIntervalLength = config.tile.size*WEAPON_RANGE/(NUMBER_OF_COLLISION_SAMPLES-1)
        this.attackHitWall = false
        this.attackVictims = []
    }
    update() {
        if(!this.attackHitWall) {
            for(var i = 0; i < NUMBER_OF_COLLISION_SAMPLES && !this.attackHitWall; i++){
                // Generate sample points for collision checks
                var samplePoint = new Pixi.Point(this.parent.position.x, this.parent.position.y)
                var samplePointOffset = new Pixi.Point((WEAPON_TILT_OFFSET - (WEAPON_TILT_OFFSET/(NUMBER_OF_COLLISION_SAMPLES-1))*(i)), i*this.sampleIntervalLength)
                samplePointOffset = Geometry.convertLocalOffsetToGlobalOffset(samplePointOffset, Math.PI*2 - this.parent.rotation)
                samplePoint = new Pixi.Point(samplePoint.x + samplePointOffset.x, samplePoint.y + samplePointOffset.y)

                // Check for collision with nearest tile
                var tileKey = Math.floor(samplePoint.x / config.tile.size) + "-" + Math.floor(samplePoint.y / config.tile.size)
                var currentTile = this.parent.game.tiles.childrenByKey[tileKey]
                var tooCloseToTileCenter = currentTile != null && Geometry.getDistance(samplePoint, currentTile.position) < config.tile.size/2
                if(currentTile != null && !currentTile.isPassable && tooCloseToTileCenter){
                    WALL_HIT_SOUND.playSound()
                    this.attackHitWall = true
                }

                // Check for collision with any monster
                for(var j = 0; j < this.parent.game.monsters.children.length && !this.attackHitWall; j++){
                    var currentMonster = this.parent.game.monsters.children[j]
                    var alreadyAVictim = false
                    for(var k = 0; k < this.attackVictims.length; k++){
                        if(currentMonster == this.attackVictims[k]){
                            alreadyAVictim = true
                        }
                    }
                    if(currentMonster.isDead != true
                    && Geometry.getDistance(currentMonster.position, samplePoint) < currentMonster.radius
                    && !alreadyAVictim) {
                        this.attackVictims.push(currentMonster)
                        currentMonster.beAttacked({
                            direction: this.parent.rotation,
                            force: 15
                        })
                    }
                }
            }
        }
    }
}
