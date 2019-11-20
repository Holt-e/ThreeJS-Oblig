import {Mesh} from '../lib/three.module.js';

export default class PhysicsObject extends Mesh {

    constructor(geometry, material, weight = 0, collision = true, sizeY = 1,
                maxSpeed = 0.01, maxAcceleration = 1, running = false) {

        super(geometry, material);

        this.speed = {
            x: 0,
            y: 0,
            z: 0
        };

        this.acceleration = {
            x: 0,
            y: 0,
            z: 0
        };

        this.weight = weight;
        this.collision = collision;
        this.sizeY = sizeY;
        this.maxSpeed = maxSpeed;
        this.maxAcceleration = maxAcceleration;
        this.running = running;

    }

}