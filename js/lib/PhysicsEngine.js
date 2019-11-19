import Utilities from '../lib/Utilities.js';
import {Vector3} from "./three.module.js";
import {GRAVITY, RAYCAST_HEIGHT} from "../main.js";

export default class PhysicsEngine {

    constructor(physicsObjects, raycaster, terrain) {

        this.physicsObjects = physicsObjects;
        this.raycaster = raycaster;
        this.terrain = terrain;
    }

    touchingGround(p, groundHeight) {
        return p.position.y === groundHeight + 1;
    }

    getGroundHeight(p) {
        this.raycaster.set(new Vector3(p.position.x, RAYCAST_HEIGHT, p.position.z), new Vector3(0, -1, 0));
        let intersect = this.raycaster.intersectObject(this.terrain, true);
        if (intersect.length > 0) {
            return intersect[0].point.y;
        } else {
            return 10;
        }
    }

    update(deltaTime) {

        this.physicsObjects.forEach((p) => {
            let groundHeight = this.getGroundHeight(p);


            //If the inputs should be allowed to accelerate the object.
            /*
            if(this.touchingGround(p,groundHeight)) {

            } else {
                p.acceleration.x = 0;
                p.acceleration.z = 0;
            */
            if (p.acceleration.y === 0) {
                p.acceleration.y = GRAVITY;
            }

            /*
                        p.acceleration.x = Utilities.clamp(p.acceleration.x, -p.maxAcceleration, p.maxAcceleration);
                        p.acceleration.z = Utilities.clamp(p.acceleration.z, -p.maxAcceleration, p.maxAcceleration);
            */

            p.speed.x = Utilities.clamp(p.speed.x + p.acceleration.x * deltaTime, -p.maxSpeed, p.maxSpeed);
            p.speed.y = Utilities.clamp(p.speed.y + p.acceleration.y * deltaTime, -10, p.maxSpeed);
            p.speed.z = Utilities.clamp(p.speed.z + p.acceleration.z * deltaTime, -p.maxSpeed, p.maxSpeed);


            //Translation step
            p.translateOnAxis(new Vector3(1, 0, 0), (p.speed.x * deltaTime + 0.5 * p.acceleration.x * Math.pow(deltaTime, 2)));
            p.translateOnAxis(new Vector3(0, 0, 1), (p.speed.z * deltaTime + 0.5 * p.acceleration.z * Math.pow(deltaTime, 2)));

            p.position.y = p.position.y + (p.speed.y * deltaTime + 0.5 * p.acceleration.y * Math.pow(deltaTime, 2));
            p.position.y = groundHeight + 1;
        })
    }
}