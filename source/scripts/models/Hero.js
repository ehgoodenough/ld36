import Pixi from "pixi.js"
import Keyb from "keyb"

import config from "config.js"

import Geometry from "scripts/utility/Geometry.js"
import Input from "scripts/utility/Input.js"

import Tile from "scripts/models/Tile.js"

var HERO_TEXTURE = Pixi.Texture.fromImage(require("images/hero1.png"))
var GAMEPAD_THRESHOLD = 0.05
var MAXIMUM_VELOCITY = 1

export default class Hero extends Pixi.Sprite {
    constructor() {
        super(HERO_TEXTURE)

        this.position.x = 7 * 32
        this.position.y = 4 * 32
        this.anchor.x = 0.5
        this.anchor.y = 0.5

        this.maxVelocity = MAXIMUM_VELOCITY
        this.velocity = new Pixi.Point(0,0)
        this.friction = 2

        this.mode = "GAME MODE"
    }
    update(delta) {
        // Poll inputs
        Input.update()
        var x = Input.getX()
        var y = Input.getY()
        if(Geometry.getMagnitude(x, y) > GAMEPAD_THRESHOLD) {
            this.rotation = Geometry.getAngle(x, y)
            this.velocity.y = y * this.maxVelocity * delta
            this.velocity.x = x * this.maxVelocity * delta
        }

        if(Keyb.isJustDown("1")) {
            this.mode = "GAME MODE"
            console.log(this.mode)
        } if(Keyb.isJustDown("2")) {
            this.mode = "DEV MODE"
            console.log(this.mode)
        }

        // Collide with tiles
        if(this.mode == "GAME MODE") {
            this.parent.tiles.children.forEach((child) => {
                if(child instanceof Tile) {
                    var tile = child
                    if(tile.containsPoint({
                        x: this.position.x + this.velocity.x,
                        y: this.position.y
                    })) {
                        this.velocity.x = 0
                    }
                    if(tile.containsPoint({
                        x: this.position.x,
                        y: this.position.y + this.velocity.y
                    })) {
                        this.velocity.y = 0
                    }
                }
            })
        }

        // Translation
        this.position.y += this.velocity.y
        this.position.x += this.velocity.x

        // Deceleration
        this.velocity.y *= (1 / this.friction)
        this.velocity.x *= (1 / this.friction)

        // Camera
        if(this.mode == "GAME MODE") {
            // If you are currently within a camera zone, focus on that.
            if(this.camera && this.camera.containsPoint(this.position)) {
                this.camera.focus()
            } else {
                // If you are no longer within a camera zone, find a new zone!
                this.camera = this.parent.cameras.children.find((camera) => {
                    if(camera.containsPoint(this.position)) {
                        camera.focus()
                        return true
                    }
                })
                // If you couldn't find any camera
                // zones, just center the camera on you.
                if(this.camera == undefined) {
                    this.focus()
                }
            }
        } else if(this.mode == "DEV MODE") {
            this.focus()
        }

        // Enable dev mode
        if(this.mode == "DEV MODE") {
            this.tint = 0x0000CC
            if(Input.getButton()) {
                this.parent.tiles.addChild(new Tile({
                    tx: Math.floor(this.position.x / config.tile.size),
                    ty: Math.floor(this.position.y / config.tile.size),
                }))
            }
        } else if(this.mode == "GAME MODE") {
            this.tint = 0xFFFFFF
        }
    }
    focus() {
        this.parent.superposition.x = -1 * (this.position.x - (config.frame.width / 2))
        this.parent.superposition.y = -1 * (this.position.y - (config.frame.height / 2))
    }
}