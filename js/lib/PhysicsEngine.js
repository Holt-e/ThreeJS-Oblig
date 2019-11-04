import Utilities from '../lib/Utilities.js';
import {Vector3} from "./three.module.js";

export default class PhysicsEngine {

    constructor(physicsObjects, raycaster, terrain) {

        this.physicsObjects = physicsObjects;
        this.raycaster = raycaster;
        this.terrain = terrain;
    }

    update(deltaTime) {

        this.physicsObjects.forEach((p) => {

            let position = [];
            position.x = p.position.x;
            position.z = p.position.z;
            let groundHeight = 10;
            this.raycaster.set(new Vector3(p.position.x, 50, p.position.z), new Vector3(0, -1, 0));

            let intersect = this.raycaster.intersectObject(this.terrain);
            if (intersect.length > 0) {
                groundHeight = intersect[0].point.y;
            }

            p.acceleration.x = Utilities.clamp(p.acceleration.x, -p.maxAcceleration, p.maxAcceleration);

            p.acceleration.z = Utilities.clamp(p.acceleration.z, -p.maxAcceleration, p.maxAcceleration);

            p.speed.x = Utilities.clamp(p.speed.x + p.acceleration.x * deltaTime, -p.maxSpeed, p.maxSpeed);
            p.speed.y = Utilities.clamp(p.speed.y + p.acceleration.y * deltaTime, -10, p.maxSpeed);
            p.speed.z = Utilities.clamp(p.speed.z + p.acceleration.z * deltaTime, -p.maxSpeed, p.maxSpeed);

            p.translateOnAxis(new Vector3(1, 0, 0), (p.speed.x * deltaTime + 0.5 * p.acceleration.x * Math.pow(deltaTime, 2)));

            if (p.jump) {
                p.position.y = p.position.y + (p.speed.y * deltaTime + 0.5 * p.acceleration.y * Math.pow(deltaTime, 2));
            } else {
                if (p.position.y > groundHeight + 1) {
                    p.position.y = p.position.y + (p.speed.y * deltaTime + 0.5 * p.acceleration.y * Math.pow(deltaTime, 2));

                } else if (p.position.y === groundHeight + 1) {
                    p.acceleration.y = 0;

                } else if (p.position.y < groundHeight + 1) {
                    p.position.y = groundHeight + 1;
                }
            }


            p.translateOnAxis(new Vector3(0, 0, 1), (p.speed.z * deltaTime + 0.5 * p.acceleration.z * Math.pow(deltaTime, 2)));

        })
    }
}