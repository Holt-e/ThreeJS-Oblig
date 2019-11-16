import {Quaternion, Vector3} from '../lib/three.module.js';

export default class MousePitchController {

    constructor(camera) {

        this.camera = camera;

        this.FD = new Vector3(0, 0, 1);
        this.UD = new Vector3(0, 1, 0);
        this.LD = new Vector3(1, 0, 0);

        this.pitchQuaternion = new Quaternion();
        this.yawQuaternion = new Quaternion();

    }

    update(pitch, yaw) {

        this.pitchQuaternion.setFromAxisAngle(this.LD, -pitch);

        this.camera.setRotationFromQuaternion(this.camera.quaternion.multiply(this.pitchQuaternion));

    }

}