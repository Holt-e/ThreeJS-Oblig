import {Quaternion, Vector3} from '../lib/three.module.js';

export default class MousePitchController {

    constructor(camera) {

        this.camera = camera;
        this.LD = new Vector3(1, 0, 0);

        this.pitchQuaternion = new Quaternion();

    }

    update(pitch) {

        this.pitchQuaternion.setFromAxisAngle(this.LD, -pitch);

        this.camera.setRotationFromQuaternion(this.camera.quaternion.multiply(this.pitchQuaternion));

    }

}