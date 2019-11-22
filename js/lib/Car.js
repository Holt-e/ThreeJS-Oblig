"use strict";
import {Object3D} from "./three.module.js";
import {GLTFLoader} from "../loaders/GLTFLoader.js";

export default class Car extends Object3D {
    constructor() {
        super();
    }

    async loadAssets() {
        let gltfLoader = new GLTFLoader();
        await gltfLoader.load(
            "resources/models/scene.gltf",
            (gltf) => {
                let car = gltf.scene.children[0];
                car.scale.set(0.005, 0.005, 0.005);
                car.name = "car";
                car.rotation.z = Math.PI;
                car.traverse(function (child) {
                    child.castShadow = true;
                });
                this.add(car);
            },
        );
    }
}