export default class Geometry {
    static getMagnitude(x, y) {
        if(x != 0 || y != 0) {
            return Math.sqrt(x*x + y*y)
        } else {
            return 0
        }
    }
    static getDistance(point1, point2) {
        var vector = {x: point2.x - point1.x, y: point2.y - point1.y}
        return Geometry.getMagnitude(vector.x, vector.y)
    }
    static getAngle(x, y) {
        var angle = Math.atan2(y, x)
        if(angle < 0) {
            angle += Math.PI*2
        }
        angle -= Math.PI/2
        return angle
    }
    static getAngleBetweenTwoVectors(vector1, vector2) {
        var angle1 = Geometry.getAngle(vector1.x, vector1.y)
        var angle2 = Geometry.getAngle(vector2.x, vector2.y)
        if(angle1 > angle2){
            return angle1-angle2
        }else{
            return angle2-angle1
        }
    }
    static convertLocalOffsetToGlobalOffset(offsetVector, rotation){
        var globalOffset = {x: 0, y: 0}

        // Translate in the local Y direction
        globalOffset.x = globalOffset.x + Math.cos(rotation-Math.PI/2)*offsetVector.y
        globalOffset.y = globalOffset.y - Math.sin(rotation-Math.PI/2)*offsetVector.y

        // Translate in the local X direction
        globalOffset.x = globalOffset.x - Math.cos(rotation-Math.PI)*offsetVector.x
        globalOffset.y = globalOffset.y + Math.sin(rotation-Math.PI)*offsetVector.x

        return globalOffset
    }
    static convertGlobalOffsetToLocalOffset(offsetVector, rotation){
        var localOffset = {x: 0, y: 0}

        // Translate in the global Y direction
        localOffset.x = localOffset.x + Math.cos(-1*rotation-Math.PI/2)*offsetVector.y
        localOffset.y = localOffset.y - Math.sin(-1*rotation-Math.PI/2)*offsetVector.y

        // Translate in the global X direction
        localOffset.x = localOffset.x - Math.cos(-1*rotation-Math.PI)*offsetVector.x
        localOffset.y = localOffset.y + Math.sin(-1*rotation-Math.PI)*offsetVector.x

        return localOffset
    }
}
