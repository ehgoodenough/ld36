import Geometry from "scripts/utility/Geometry.js"
import config from "config.js"

export default class CircleCollider{
    constructor(position, scale) {
        this.shape = "circle"
        this.position = position
        this.scale = scale.x * config.tile.size
        this.hitList = []
    }
    checkForCollision(otherCollider){
        for(var i = 0; i < otherCollider.hitList.length; i++){
            if(otherCollider.hitList[i] == this){
                this.hitList.push(otherCollider)
                return true
            }
        }

        var foundACollision = false
        if(otherCollider.shape == "circle"){
            var distanceBetweenColliders = Geometry.getDistance(this.position, otherCollider.position)
            var sumOfRadii = this.scale/2 + otherCollider.scale/2
            if(distanceBetweenColliders < sumOfRadii){
                foundACollision = true
            }
        } else if(otherCollider.shape == "rectangle"){
            foundACollision = otherCollider.checkForCollision(this)
        }

        if(foundACollision){
            this.hitList.push(otherCollider)
            otherCollider.hitList.push(this)
        }

        return foundACollision
    }
    update(position, scale, rotation){
        this.hitList = []
        this.position = position
        this.scale = scale.x * config.tile.size
    }
}