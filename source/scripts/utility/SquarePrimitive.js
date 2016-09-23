import Pixi from "pixi.js"
import Geometry from "scripts/utility/Geometry.js"
import RectangleCollider from "scripts/utility/RectangleCollider.js"
import config from "config.js"

var WHITE_BOX_TEXTURE = Pixi.Texture.fromImage(require("images/white.png"))
export default class SquarePrimitive extends Pixi.Sprite{
    constructor(position, scale, rotation) {
        super(WHITE_BOX_TEXTURE)
        this.anchor.x = 0.5
        this.anchor.y = 0.5
        this.scale.x = scale.x
        this.scale.y = scale.y
        this.rotation = rotation
        this.position.x = position.x
        this.position.y = position.y
        this.collider = new RectangleCollider(position, {x: scale.x, y: scale.y}, -1 * rotation)
        this.collider.parent = this
    }
    update(){
        this.rotation += 0.01
        this.collider.update(this.position, {x: this.scale.x, y: this.scale.y}, -1 * this.rotation)
    }
    get tint() {
        if(this.collider.hitList.length > 0){
            return 0x000099
        } else{
            return 0xFFFFFF
        }
    }

}