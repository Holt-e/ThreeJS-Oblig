"use strict";

import {DirectionalLight} from "./three.module.js";
import {SHADOWMAP_SIZE, TERRAIN_SIZE} from "../main.js";

export default class Sunlight extends DirectionalLight {
    constructor() {
        super(0xffffff, 3);
        this.position.y = 200;
        this.position.z = 400;
        this.position.z = 400;
        this.castShadow = true;
        //Set up shadow properties for the light
        this.shadow.mapSize.width = SHADOWMAP_SIZE;  // default
        this.shadow.mapSize.height = SHADOWMAP_SIZE; // default
        this.shadow.camera.near = 0.5;    // default
        this.shadow.camera.far = 1000;     // default
        let cameraSize = TERRAIN_SIZE / 2;
        let cameraTopBot = cameraSize / 2;
        this.shadow.camera.left = -cameraSize;
        this.shadow.camera.bottom = -cameraTopBot + 50;
        this.shadow.camera.right = cameraSize;
        this.shadow.camera.top = cameraTopBot + 30;
    }
}