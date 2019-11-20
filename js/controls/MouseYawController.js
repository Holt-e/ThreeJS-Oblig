import {Quaternion, Vector3} from '../lib/three.module.js';

export default class MouseYawController {

    constructor(camera) {
        
        this.camera = camera;
        this.UD = new Vector3(0, 1, 0);
        this.yawQuaternion = new Quaternion();

    }

    update(yaw) {

        this.yawQuaternion.setFromAxisAngle(this.UD, -yaw);

        this.camera.setRotationFromQuaternion(this.yawQuaternion.multiply(this.camera.quaternion));

    }
    
}