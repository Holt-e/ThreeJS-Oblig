"use strict";
import {Mesh, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, Texture, UVMapping} from "./three.module.js";
import Utilities from "./Utilities.js";
import {WATER_ANIMATION_ENABLE} from "../main.js";

export default class Water extends Mesh {
    constructor(envMap) {
        let waterGeometry = new PlaneGeometry(100, 100, 64, 64);
        let waterMaterial = new MeshStandardMaterial({
            transparent: true,
            opacity: 0.6,
            color: 0x31728a,
            metalness: 0.3,
            refractionRatio: 0.75,
            roughness: 0.1,
            envMapIntensity: 1,
            envMap: envMap
        });

        super(waterGeometry, waterMaterial);
        this.waterImageNumber = 0;

        this.scale.set(5, 5, 5);
        this.position.y = 15;
        this.position.x = -160;
        this.position.z = -160;
        this.rotation.x = -Math.PI / 2;
        this.oceanDisplacementMap = [];
    }

    async loadAssets() {

        let promises = [];

        for (let i = 1; i < 121; i++) {
            promises.push(Utilities.loadImage(`resources/textures/waterAnimated/${i.toString().padStart(4, '0')}.png`))
        }

        let waterDisplacementMap = await Promise.all(promises);
        for (let i = 0; i < 120; i++) {
            this.oceanDisplacementMap.push(new Texture(waterDisplacementMap[i], UVMapping, RepeatWrapping, RepeatWrapping));
            this.oceanDisplacementMap[i].repeat.set(2, 2);
            this.oceanDisplacementMap[i].needsUpdate = true;
        }
    }

    update() {
        if (WATER_ANIMATION_ENABLE) {

            this.material.displacementMap = this.oceanDisplacementMap[this.waterImageNumber];
            this.material.normalMap = this.oceanDisplacementMap[this.waterImageNumber];

            this.material.displacementMap.needsUpdate = true;

            this.material.normalMap.needsUpdate = true;

            this.waterImageNumber++;
            if (this.waterImageNumber > 119) {
                this.waterImageNumber = 0;
            }
        }
    }
}