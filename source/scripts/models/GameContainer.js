import Pixi from "pixi.js"
import Keyb from "keyb"

import config from "config.js"
var world = require("data/world.json")

import Hero from "scripts/models/Hero.js"
import Monster from "scripts/models/Monster.js"
import Tile from "scripts/models/Tile.js"
import Camera from "scripts/models/Camera.js"
import Floor from "scripts/models/Floor.js"

import KeyContainer from "scripts/utility/KeyContainer.js"
import Geometry from "scripts/utility/Geometry.js"
import Cartographer from "scripts/utility/Cartographer.js"

import CircleCollider from "scripts/utility/CircleCollider.js"
import RectangleCollider from "scripts/utility/RectangleCollider.js"
import SquarePrimitive from "scripts/utility/SquarePrimitive.js"
import CirclePrimitive from "scripts/utility/CirclePrimitive.js"

const CAMERA_TRANSITION_FRICTION = 0.05

var TRACK_1 = require("sounds/TheMachineInDanger.mp3")

export default class GameContainer extends Pixi.Container {
    constructor() {
        super()

        // Instantiate the objects.

        this.hero = new Hero(world.hero)

        this.tiles = new KeyContainer()
        this.cameras = new KeyContainer()
        this.monsters = new KeyContainer()
        this.floors = new KeyContainer()
        this.colliders = []

        //this.cartographer = new Cartographer()

        // Add to the container.

        this.addChild(this.floors)
        this.addChild(this.tiles)
        this.addChild(this.cameras)
        this.addChild(this.monsters)
        this.addChild(this.hero)


        // Load from the data.

        world.floors.forEach((floor) => {
            this.floors.addChild(new Floor(floor))
        })
        world.tiles.forEach((tile) => {
            this.tiles.addChild(new Tile(tile))
        })
        world.cameras.forEach((camera) => {
            this.cameras.addChild(new Camera(camera))
        })
        world.monsters.forEach((monster) => {
            this.monsters.addChild(new Monster(monster))
        })

        // Setup the camera.

        this.targetposition = new Pixi.Point()
        this.jumpCameraToHero()

        this.music = new Audio(TRACK_1)
        this.music.loop = true
        this.music.volume = 0.5
        //this.music.play()
        // console.log("To edit the world, change your mode by hitting 1, 2 or 3.")
        // console.log("To copy the world to your clipboard, run copy(game.data)")

        this.tags = {}

        //this.cartographer.createMap(this.tiles)
        // var vector = {x:-4, y:30}
        // var rotation = 0
        // var globalOffsetVector = Geometry.convertLocalOffsetToGlobalOffset(vector, rotation)
        // var localOffsetVector = Geometry.convertGlobalOffsetToLocalOffset(globalOffsetVector, rotation)
        // console.log('x: ' + localOffsetVector.x +', y: ' + localOffsetVector.y)

        var collider1Position = {x: 40, y: 100}
        var collider1Scale = {x: 4, y: .5}
        var collider1Rotation = Math.PI*1.4

        var collider2Position = {x: 0, y: 60}
        var collider2Scale = {x: 1, y: 1}
        var collider2Rotation = 0

        this.testSquare1 = new SquarePrimitive(collider1Position, collider1Scale, -1*collider1Rotation)
        this.testSquare1.game = this
        this.colliders.push(this.testSquare1.collider)
        this.testCircle1 = new CirclePrimitive(collider2Position, collider2Scale, -1*collider2Rotation)
        this.testCircle1.game = this
        this.colliders.push(this.testCircle1.collider)

        this.colliders.push(this.hero.collider)

        this.addChild(this.testSquare1)
        this.addChild(this.testCircle1)
    }
    jumpCameraToHero() {
        this.hero.considerTheCamera()
        this.position.x = this.targetposition.x
        this.position.y = this.targetposition.y
    }
    addChild(child) {
        super.addChild(child)
        child.game = this
    }
    update(delta) {
        // updating entities
        this.hero.update(delta)

        this.monsters.children.forEach((monster) => {
            monster.update(delta)
        })

        // fixing render order
        this.monsters.sortChildren()

        // moving camera to the target position
        this.position.x += (this.targetposition.x - this.position.x) / (1 / CAMERA_TRANSITION_FRICTION)
        this.position.y += (this.targetposition.y - this.position.y) / (1 / CAMERA_TRANSITION_FRICTION)

        // open doors (SUPER HACKY HARDCODING BUT WHATEVER IT'S A GAME JAM)
        if(this.hero.tx == -4
        && this.hero.ty == 0
        && this.tags["first-shortcut"] != true) {
            this.tags["first-shortcut"] = true
            this.tiles.children.forEach((tile) => {
                if(tile.tag == "first-shortcut") {
                    tile.isPassable = true
                    tile.isVisible = false
                }
            })
        }
        if(this.hero.tx == 4
        && this.hero.ty == -2
        && this.tags["second-shortcut"] != true) {
            this.tags["second-shortcut"] = true
            this.tiles.children.forEach((tile) => {
                if(tile.tag == "second-shortcut") {
                    tile.isPassable = true
                    tile.isVisible = false
                }
            })
        }

        // win condition
        if(Monster.spawnerCount == 0
        && this.initiateEnding != true) {
            this.inintiateEnding = true
            var index = 0
            this.monsters.children.forEach((monster) => {
                if(monster.isAngered && !monster.isDead) {
                    var x = monster.position.x - this.hero.position.x
                    var y = monster.position.y - this.hero.position.y
                    monster.beAttacked({
                        direction: Geometry.getAngle(x, y),
                        force: 30,
                        isStunned: true,
                        damage: 0.5
                    })
                    var timer = 1500 + (++index * 100)
                    window.setTimeout(function(monster) {
                        monster.beAttacked({damage: 999})
                    }.bind(null, monster), timer)
                }
            })
            window.setTimeout(() => {
                document.getElementById("you-win").style = "opacity: 1; visibility: visible;"
            }, 3000)
        }

        // Some debugging tools

        if(this.hero.mode != "GAME MODE") {
            if(Keyb.isJustDown("R")) {
                var position = this.hero.position.clone()
                this.hero.beKilled()
                this.hero.position.copy(position)
            }

            if(Keyb.isDown("T")) {
                this.scale.x = 0.25
                this.scale.y = 0.25
                this.position.x = -1.25 * 32
                this.position.y = 4 * 32
            } else {
                this.scale.x = 1
                this.scale.y = 1
            }
        }

        if(Keyb.isJustDown("M")) {
            if(this.music.paused){
                this.music.play()
            } else{
                this.music.pause()
            }
        }

        this.testSquare1.update()
        this.testCircle1.update()
        for(var i = 0; i < this.colliders.length; i++){
            var curCollider = this.colliders[i]
            for(var j = 0; j < this.colliders.length; j++){
                if(i < j){
                    this.colliders[i].checkForCollision(this.colliders[j])
                }
            }
        }
    }
    get data() {
        return {
            hero: this.hero.data,
            tiles: this.tiles.data,
            floors: this.floors.data,
            cameras: this.cameras.data,
            monsters: this.monsters.data,
        }
    }
}
