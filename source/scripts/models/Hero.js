import Pixi from "pixi.js"
import Keyb from "keyb"

import config from "config.js"

import Geometry from "scripts/utility/Geometry.js"
import RectangleCollider from "scripts/utility/RectangleCollider.js"
import CircleCollider from "scripts/utility/CircleCollider.js"
import Input from "scripts/utility/Input.js"
import Sound from "scripts/utility/Sound.js"

import Tile from "scripts/models/Tile.js"
import Monster from "scripts/models/Monster.js"
import Camera from "scripts/models/Camera.js"

import Spear from "scripts/models/Spear.js"

var HERO_TEXTURE = Pixi.Texture.fromImage(require("images/hero1.png"))
var ATTACKING_TEXTURE = Pixi.Texture.fromImage(require("images/hero1attacking.png"))
var OUCH_SOUND = new Sound(require("sounds/ouch.mp3"))
var NOWAY_SOUND = new Sound(require("sounds/noway.mp3"))
var GAMEPAD_THRESHOLD = 0.05
var MAXIMUM_VELOCITY = 1
var EPSILON = 0.00001

export default class Hero extends Pixi.Sprite {
    constructor(hero) {
        super(HERO_TEXTURE)

        this.anchor.x = 0.5
        this.anchor.y = 0.5
        this.position.x = (hero.tx + this.anchor.x) * config.tile.size
        this.position.y = (hero.ty + this.anchor.y) * config.tile.size

        this.maxVelocity = MAXIMUM_VELOCITY
        this.velocity = new Pixi.Point(0,0)
        this.friction = 2

        this.mode = "GAME MODE"

        this.radius = 16 // pixels
        this.beAttackedCooldown = 0 // seconds
        this.health = 6 // halfhearts

        this.spawnposition = new Pixi.Point()
        this.spawnposition.x = this.position.x
        this.spawnposition.y = this.position.y
        this.spawnhealth = this.health

        this.spear = null
        this.isAttacking = false
        this.attackCooldownTime = 0.15
        this.timeBetweenAttacks = 0.3
        this.timeSinceAttack = this.attackCooldownTime

        this.monsterRank = "warrior"

        this.collider = new CircleCollider(this.position, this.scale, this.rotation)
        this.collider.parent = this
        //this.addChild(this.collider)
    }
    update(delta) {
        // Poll inputs
        Input.update()
        var x = Input.getX()
        var y = Input.getY()
        if(Geometry.getMagnitude(x, y) > GAMEPAD_THRESHOLD
            && !this.isAttacking) {
            this.rotation = Geometry.getAngle(x, y)
            this.velocity.y = y * this.maxVelocity * delta.f
            this.velocity.x = x * this.maxVelocity * delta.f
        }

        if(Keyb.isJustDown("1")) {
            this.mode = "GAME MODE"
            console.log(this.mode)
        } if(Keyb.isJustDown("2")) {
            this.mode = "DEV MODE: TILES"
            console.log(this.mode)
        } if(Keyb.isJustDown("3")) {
            this.mode = "DEV MODE: CAMERAS"
            console.log(this.mode)
        } if(Keyb.isJustDown("4")) {
            this.mode = "DEV MODE: MONSTERS"
            console.log(this.mode, this.monsterRank)
        } if(Keyb.isJustDown("5")) {
            this.mode = "DEV MODE: PAUSE"
            console.log(this.mode, this.monsterRank)
        }

        // Collide with tiles
        if(this.mode == "GAME MODE") {
            this.parent.tiles.children.forEach((tile) => {
                if(!tile.isPassable) {
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
            if(Input.getButton() && !this.isAttacking && this.timeSinceAttack > this.timeBetweenAttacks){
                this.attack()
            }
            if(this.isAttacking){
                this.spear.update()
            }
        }

        //Max velocity check
        var magnitudeOfVelocity = Geometry.getMagnitude(this.velocity.x, this.velocity.y)
        if(magnitudeOfVelocity > MAXIMUM_VELOCITY){
            this.velocity.x *= (1/magnitudeOfVelocity)*MAXIMUM_VELOCITY
            this.velocity.y *= (1/magnitudeOfVelocity)*MAXIMUM_VELOCITY
        }

        // Translation
        this.position.y += this.velocity.y
        this.position.x += this.velocity.x

        // Deceleration
        this.velocity.y *= (1 / this.friction)
        this.velocity.x *= (1 / this.friction)
        if(this.velocity.y < EPSILON && this.velocity.x < EPSILON){
            this.velocity.y = 0
            this.velocity.x = 0
        }

        // Camera
        this.considerTheCamera()

        // Enable dev mode
        if(this.mode == "DEV MODE: TILES") {
            if(Input.getButton()) {
                this.parent.tiles.addChild(new Tile({
                    tx: Math.floor(this.position.x / config.tile.size),
                    ty: Math.floor(this.position.y / config.tile.size),
                }))
            } if(Input.getAltButton()) {
                this.parent.tiles.children.forEach((tile) => {
                    if(tile.containsPoint(this.position)) {
                        this.parent.tiles.removeChild(tile)
                    }
                })
            }
        } else if(this.mode == "DEV MODE: CAMERAS") {
            if(Input.getButton()) {
                if(this.firstposition == undefined) {
                    this.firstposition = {
                        tx: Math.floor(this.position.x / config.tile.size),
                        ty: Math.floor(this.position.y / config.tile.size)
                    }
                } else {
                    var secondposition = {
                        tx: Math.floor(this.position.x / config.tile.size),
                        ty: Math.floor(this.position.y / config.tile.size)
                    }
                    this.parent.cameras.addChild(new Camera({
                        tx: Math.min(this.firstposition.tx, secondposition.tx),
                        ty: Math.min(this.firstposition.ty, secondposition.ty),
                        tw: Math.abs(this.firstposition.tx - secondposition.tx) + 1,
                        th: Math.abs(this.firstposition.ty - secondposition.ty) + 1,
                    }))
                    delete this.firstposition
                }
            } if(Input.getAltButton()) {
                this.parent.cameras.children.forEach((camera) => {
                    if(camera.containsPoint(this.position)) {
                        this.parent.cameras.removeChild(camera)
                    }
                })
            }
        } else if(this.mode == "DEV MODE: MONSTERS"){
            if(Keyb.isJustDown("Z")){
                this.monsterRank = "warrior"
                console.log(this.mode, this.monsterRank)
            } if(Keyb.isJustDown("X")){
                this.monsterRank = "grunt"
                console.log(this.mode, this.monsterRank)
            } if(Keyb.isJustDown("C")){
                this.monsterRank = "tank"
                console.log(this.mode, this.monsterRank)
            } if(Keyb.isJustDown("V")){
                this.monsterRank = "elite"
                console.log(this.mode, this.monsterRank)
            } if(Keyb.isJustDown("B")){
                this.monsterRank = "spawner"
                console.log(this.mode, this.monsterRank)
            }
            if(Input.getButton()) {
                this.parent.monsters.addChild(new Monster({
                    tx: Math.floor(this.position.x / config.monster.size),
                    ty: Math.floor(this.position.y / config.monster.size),
                    rank: this.monsterRank
                }))
            } if(Input.getAltButton()) {
                this.parent.monsters.children.forEach((monster) => {
                    if(monster.containsPoint(this.position)) {
                        this.parent.monsters.removeChild(monster)
                        if(monster.rank == "spawner") {
                            Monster.decreaseSpawnerCount()
                        }
                    }
                })
            }
        }

        this.collider.update(this.position, {x: this.scale.x, y: this.scale.y}, this.rotation)

        // Cooldowns
        if(this.beAttackedCooldown > 0) {
            this.beAttackedCooldown -= delta.s
        }
        if(this.isAttacking) {
            if(this.timeSinceAttack < this.attackCooldownTime) {
                this.timeSinceAttack += delta.s
            } else {
                this.texture = HERO_TEXTURE
                this.spear.visible = false
                this.isAttacking = false
            }
        } else if(this.timeSinceAttack < this.timeBetweenAttacks) {
            this.timeSinceAttack += delta.s
        }
    }
    considerTheCamera() {
        if(this.mode == "GAME MODE" || this.mode == "DEV MODE: PAUSE") {
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
        } else if(this.mode.startsWith("DEV MODE")) {
            this.focus()
        }
    }
    focus() {
        this.parent.targetposition.x = -1 * (this.position.x - (config.frame.width / 2))
        this.parent.targetposition.y = -1 * (this.position.y - (config.frame.height / 2))
    }
    get tint() {
        if(this.mode == "DEV MODE: TILES") {
            return 0x0000CC
        } if(this.mode == "DEV MODE: CAMERAS") {
            return 0x00CC00
        } if(this.mode == "DEV MODE: MONSTERS") {
            return 0xCC0000
        }

        if(this.mode == "GAME MODE") {
            if(this.beAttackedCooldown > 0
            && Math.floor(this.beAttackedCooldown * 10) % 2 == 0) {
                return 0xCC0000
            }

            return 0xFFFFFF
        }

        return 0xFFFFFF
    }
    attack(){
        var spear = new Spear({x: 0, y: 32})
        this.spear = spear
        this.addChild(spear)
        this.isAttacking = true
        this.texture = ATTACKING_TEXTURE
        this.timeSinceAttack = 0
    }
    beAttacked(attack) {
        if(this.beAttackedCooldown <= 0) {
            this.health -= attack.damage || 1
            OUCH_SOUND.playSound()
            if(this.health <= 0) {
                this.beKilled()
            } else {
                this.beAttackedCooldown = attack.cooldown || 1
            }
        }
    }
    beKilled() {
        NOWAY_SOUND.playSound()
        this.position.copy(this.spawnposition)
        this.health = this.spawnhealth

        this.game.monsters.children.forEach((monster) => {
            monster.reset()
        })

        this.game.jumpCameraToHero()
    }
    get data() {
        return {
            tx: Math.floor(this.spawnposition.x / config.tile.size),
            ty: Math.floor(this.spawnposition.y / config.tile.size)
        }
    }
    get tx() {
        return Math.floor(this.position.x / config.tile.size)
    }
    get ty() {
        return Math.floor(this.position.y / config.tile.size)
    }
}
