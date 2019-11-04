import Utilities from '../lib/Utilities.js';
export default class PhysicsEngine {

    constructor(physicsObjects, terrainGeometry) {

        this.physicsObjects = physicsObjects;
        this.terrainGeometry = terrainGeometry;
    }

    update(deltaTime) {

        this.physicsObjects.forEach((p) => {

            let position = [];
            position.x = p.position.x;
            position.z = p.position.z;
            let groundHeight = this.terrainGeometry.getHeightAt(position);

            p.acceleration.x = Utilities.clamp(p.acceleration.x, -p.maxAcceleration, p.maxAcceleration);
            if (p.acceleration.y === 0) {
                p.acceleration.y = -0.016;
            }

            p.acceleration.z = Utilities.clamp(p.acceleration.z, -p.maxAcceleration, p.maxAcceleration);

            p.speed.x = Utilities.clamp(p.speed.x + p.acceleration.x * deltaTime, -p.maxSpeed, p.maxSpeed);
            p.speed.z = Utilities.clamp(p.speed.z + p.acceleration.z * deltaTime, -p.maxSpeed, p.maxSpeed);

            p.position.x = p.position.x + (p.speed.x * deltaTime + 0.5 * p.acceleration.x * Math.pow(deltaTime, 2));

            if (p.position.y > groundHeight + 1) {
                p.speed.y = Utilities.clamp(p.speed.y + p.acceleration.y * deltaTime, -1, p.maxSpeed);
                p.position.y = p.position.y + (p.speed.y * deltaTime + 0.5 * p.acceleration.y * Math.pow(deltaTime, 2));

            } else if (p.position.y < groundHeight + 1) {

                console.log("Ground IF");
                p.position.y = groundHeight + 1;
            }

            p.position.z = p.position.z + (p.speed.z * deltaTime + 0.5 * p.acceleration.z * Math.pow(deltaTime, 2));

        })
    }
}