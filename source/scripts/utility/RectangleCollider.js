import Pixi from "pixi.js"
import Geometry from "scripts/utility/Geometry.js"
import Hero from "scripts/models/Hero.js"
import config from "config.js"

export default class RectangleCollider extends Pixi.Sprite{
    constructor(center, scale, rotation) {
        super()
        this.shape = "rectangle"
        this.center = {x: center.x, y: center.y}
        this.xScale = scale.x * config.tile.size
        this.yScale = scale.y * config.tile.size
        this.rotation = rotation
        this.hitList = []
    }
    checkForCollision(otherCollider){
        for(var i = 0; i < otherCollider.hitList.length; i++){
            if(otherCollider.hitList[i] == this){
                this.hitList.push(otherCollider)
                return true
            }
        }

        // If it's a rectangle, check if any of its corners are within my rectangle or vice versa
        if(otherCollider.shape == "rectangle"){
            var foundACollision = false

            // Instantiate the other collider's sample points in its local space
            var otherCorners = [{x: otherCollider.xScale*-1/2, y: otherCollider.yScale*-1/2},
            {x: otherCollider.xScale*1/2, y: otherCollider.yScale*-1/2},
            {x: otherCollider.xScale*1/2, y: otherCollider.yScale*1/2},
            {x: otherCollider.xScale*-1/2, y: otherCollider.yScale*1/2},
            {x: 0, y: 0}]

            for(var i = 0; i < otherCorners.length && !foundACollision; i++){
                // redefine the other collider's sample points to their positions in global space, relative to its center
                otherCorners[i] = Geometry.convertLocalOffsetToGlobalOffset(otherCorners[i], otherCollider.rotation)
                // now turn those relative positions into absolute positions in global space
                otherCorners[i] = {x: otherCorners[i].x + otherCollider.center.x, y: otherCorners[i].y + otherCollider.center.y}
                // now turn those absolute positions into positions relative to this collider's center, still in global space
                // you can think of this step as creating vectors from this collider's center to each sample point
                otherCorners[i] = {x: otherCorners[i].x - this.center.x, y: otherCorners[i].y - this.center.y}
                // redefine those vectors in this collider's local space
                otherCorners[i] = Geometry.convertGlobalOffsetToLocalOffset(otherCorners[i], this.rotation)

                // Finally, we can do all calculations in this collider's local space
                // Check if the current sample point is within this collider's bounds
                if(otherCorners[i].x > this.xScale *-1/2
                && otherCorners[i].x < this.xScale * 1/2
                && otherCorners[i].y > this.yScale *-1/2
                && otherCorners[i].y < this.yScale * 1/2){
                    foundACollision = true
                }
            }

            // Like earlier, but from the other collider's prespective
            if(!foundACollision){
                var myCorners = [{x: this.xScale*-1/2, y: this.yScale*-1/2},
                {x: this.xScale*1/2, y: this.yScale*-1/2},
                {x: this.xScale*1/2, y: this.yScale*1/2},
                {x: this.xScale*-1/2, y: this.yScale*1/2},
                {x: 0, y: 0}]
                for(var i = 0; i < myCorners.length && !foundACollision; i++){
                    myCorners[i] = Geometry.convertLocalOffsetToGlobalOffset(myCorners[i], this.rotation)
                    myCorners[i] = {x: myCorners[i].x + this.center.x, y: myCorners[i].y + this.center.y}
                    myCorners[i] = {x: myCorners[i].x - otherCollider.center.x, y: myCorners[i].y - otherCollider.center.y}
                    myCorners[i] = Geometry.convertGlobalOffsetToLocalOffset(myCorners[i], otherCollider.rotation)
                    if(myCorners[i].x > otherCollider.xScale *-1/2
                    && myCorners[i].x < otherCollider.xScale * 1/2
                    && myCorners[i].y > otherCollider.yScale *-1/2
                    && myCorners[i].y < otherCollider.yScale * 1/2){
                        foundACollision = true
                    }
                }
            }
        } else if(otherCollider.shape == "circle"){
            var foundACollision = false

            // Define my corners in my local space
            var myCorners = [{x: this.xScale*-1/2, y: this.yScale*-1/2},
            {x: this.xScale*1/2, y: this.yScale*-1/2},
            {x: this.xScale*1/2, y: this.yScale*1/2},
            {x: this.xScale*-1/2, y: this.yScale*1/2},
            {x: 0, y: 0}]

            // Convert my corner positions to global space
            for(var i = 0; i < myCorners.length && !foundACollision; i++){
                // I honestly don't understand why I am using negative rotation here. But it works. ¯\_(ツ)_/¯
                myCorners[i] = Geometry.convertLocalOffsetToGlobalOffset(myCorners[i], -1*this.rotation)
                myCorners[i] = {x: myCorners[i].x + this.center.x, y: myCorners[i].y + this.center.y}
                // Check if any of my corners are within the circle

                if(Geometry.getDistance(myCorners[i], otherCollider.position) < otherCollider.scale/2){
                    foundACollision = true
                }
            }

            if(!foundACollision){
                // This is gonna get a little weird

                // Define sample points for the circle in global space
                var circleCorners = [{x: 0, y: otherCollider.scale*-1/2},
                {x: otherCollider.scale*1/2, y: 0},
                {x: 0, y: otherCollider.scale*1/2},
                {x: otherCollider.scale*-1/2, y: 0},
                {x: 0, y: 0}]

                for(var i = 0; i < circleCorners.length && !foundACollision; i++){
                    // In this step, I am really rotating the sample points into their proper global offset
                    // Notice I am using this collider's rotation, not the circle's
                    circleCorners[i] = Geometry.convertLocalOffsetToGlobalOffset(circleCorners[i], this.rotation)
                    // Now get the absolute positions of the circle's corners. I know, I know. Circles don't have corners.
                    circleCorners[i] = {x: circleCorners[i].x + otherCollider.position.x, y: circleCorners[i].y + otherCollider.position.y}
                    // Then find the vectors from this collider's center to the circle corners
                    circleCorners[i] = {x: circleCorners[i].x - this.center.x, y: circleCorners[i].y - this.center.y}
                    // redefine those vectors in this collider's local space
                    circleCorners[i] = Geometry.convertLocalOffsetToGlobalOffset(circleCorners[i], this.rotation)
                    if(circleCorners[i].x > this.xScale *-1/2
                    && circleCorners[i].x < this.xScale * 1/2
                    && circleCorners[i].y > this.yScale *-1/2
                    && circleCorners[i].y < this.yScale * 1/2){
                        foundACollision = true
                    }
                }
            }
        }

        if(foundACollision){
            this.hitList.push(otherCollider)
            otherCollider.hitList.push(this)
        }

        return foundACollision
    }
    update(position, scale, rotation){
        this.hitList = []
        this.center = position
        this.xScale = scale.x * config.tile.size
        this.yScale = scale.y * config.tile.size
        this.rotation = rotation * -1
    }
}