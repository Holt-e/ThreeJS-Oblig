"use strict";

import {Vector3} from "./three.module.js";
import {RAYCAST_HEIGHT, TERRAIN_SIZE} from "../main.js";

/**
 * Collection of general purpose utilities.
 * oskarbraten, Joakim Andås Johesan
 */
export default class Utilities {
	/**
	 * Loads image from url.
	 * @param  {String} url Location of image to load.
	 * @return {Promise} A Promise-object that resolves with the Image-object.
	 */
    static loadImage(url) {
        return new Promise((resolve, reject) => {

            if (!url) {
                reject('No URL was specified.');
            }

            let image = new Image();
            image.src = url;

            image.addEventListener('load', () => {
                resolve(image);
            });

            image.addEventListener('error', () => {
                reject('Unable to load image. Make sure the URL is correct (' + image.src + ').');
            });
        });
    }

	/**
	 * Loads heightmap data from an image.
	 * The image must be completely loaded before using this method.
	 * @param  {Image} image Image to load.
	 * @return {Array} A Uint8Array containing the heightmap data.
	 */
    static getHeightmapData(image, size) {
        let canvas = document.createElement('canvas');

        // assume texture is a square
        canvas.width = size;
        canvas.height = size;

        let context = canvas.getContext('2d');
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        let data = new Float32Array(size * size);

        context.drawImage(image, 0, 0, size, size);

        let imageData = context.getImageData(0, 0, size, size).data;

        imageData.forEach((a, i) => {
            if (i % 4 === 0) { // only extract the first component of (r,g,b,a).
                data[Math.floor(i / 4)] = a / 255;
            }
        });

        return data;
    }

    static placeRock(raycaster, terrain) {
        let x = this.getRnd(-TERRAIN_SIZE / 2, TERRAIN_SIZE / 2);
        let z = this.getRnd(-TERRAIN_SIZE / 2, TERRAIN_SIZE / 2);

        raycaster.set(new Vector3(x, RAYCAST_HEIGHT, z), new Vector3(0, -1, 0));
        let intersect = raycaster.intersectObject(terrain, true);
        if (intersect.length > 0) {
            if (intersect[0].point.y < 25) {
                return this.placeRock(raycaster, terrain)
            } else {
                return new Vector3(x, intersect[0].point.y + 3, z)
            }
        } else {
            return new Vector3(x, 30, z)
        }
    }

    static placeTree(raycaster, terrain) {
        let x = this.getRnd(-TERRAIN_SIZE / 2, TERRAIN_SIZE / 2);
        let z = this.getRnd(-TERRAIN_SIZE / 2, TERRAIN_SIZE / 2);

        raycaster.set(new Vector3(x, RAYCAST_HEIGHT, z), new Vector3(0, -1, 0));
        let intersect = raycaster.intersectObject(terrain, true);
        if (intersect.length > 0) {
            if (intersect[0].point.y < 17 || intersect[0].point.y > 60) {
                return this.placeTree(raycaster, terrain)
            } else {
                return new Vector3(x, intersect[0].point.y, z)
            }
        } else {
            return new Vector3(x, 30, z)
        }
    }

    static clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    static getRnd(min, max) {
        return Math.random() * (max - min) + min;
    }

    static getRndInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

}