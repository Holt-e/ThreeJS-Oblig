import {
    BoxBufferGeometry,
    CubeTextureLoader,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    PointLight,
    RepeatWrapping,
    Scene,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer
} from './lib/three.module.js';

import Utilities from './lib/Utilities.js';
import MouseLookController from './controls/MouseLookController.js';

import TextureSplattingMaterial from './materials/TextureSplattingMaterial.js';
import TerrainBufferGeometry from './terrain/TerrainBufferGeometry.js';

const textureLoader = new TextureLoader();
const scene = new Scene();

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


/**
 * Handle window resize:
 *  - update aspect ratio.
 *  - update projection matrix
 *  - update renderer size
 */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

/**
 * Add canvas element to DOM.
 */
let canvas = document.createElement('canvas');
let context = canvas.getContext('webgl2', {alpha: false});
const renderer = new WebGLRenderer({canvas: canvas, context: context});
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const pointLight = new PointLight(0xffffff);
pointLight.position.y = 30;

pointLight.castShadow = true;

//Set up shadow properties for the light
pointLight.shadow.mapSize.width = 1024;  // default
pointLight.shadow.mapSize.height = 1024; // default
pointLight.shadow.camera.near = 0.5;    // default
pointLight.shadow.camera.far = 500;     // default

scene.add(pointLight);


const geometry = new BoxBufferGeometry(1, 1, 1);
const material = new MeshPhongMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);

cube.castShadow = true;
cube.position.set(0, 15, 0);

scene.add(cube);

camera.position.z = 10;
camera.position.y = 25;


/**
 * Add terrain:
 * 
 * We have to wait for the image file to be loaded by the browser.
 * We pass a callback function with the stuff we want to do once the image is loaded.
 * There are many ways to handle asynchronous flow in your application.
 * An alternative way to handle asynchronous functions is async/await
 *  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
 */

//// Terrain ////
Utilities.loadImage('resources/images/heightmap.png').then((heightmapImage) => {

    const width = 100;

    const terrainGeometry = new TerrainBufferGeometry({
        width,
        heightmapImage,
        numberOfSubdivisions: 128,
        height: 10
    });

    const grassTexture = new TextureLoader().load('resources/textures/grass_01.jpg');
    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;
    grassTexture.repeat.set(1000/width, 1000/width);

    const snowyRockTexture = new TextureLoader().load('resources/textures/snowy_rock_01.png');
    snowyRockTexture.wrapS = RepeatWrapping;
    snowyRockTexture.wrapT = RepeatWrapping;
    snowyRockTexture.repeat.set(1500/width, 1500/width);


    const splatMap = new TextureLoader().load('resources/images/splatmap_01.png');

    const terrainMaterial = new TextureSplattingMaterial({
        color: 0x777777,
        shininess: 0,
        textures: [snowyRockTexture, grassTexture],
        splatMaps: [splatMap]
    });

    const terrain = new Mesh(terrainGeometry, terrainMaterial);

    terrain.castShadow = true;
    terrain.receiveShadow = true;

    scene.add(terrain);

});

//// ENV MAP ////

const loader = new CubeTextureLoader();
const environmentMap = loader.load([
    'resources/images/skybox/miramar_ft.jpg',
    'resources/images/skybox/miramar_bk.jpg',
    'resources/images/skybox/miramar_up.jpg',
    'resources/images/skybox/miramar_dn.jpg',
    'resources/images/skybox/miramar_rt.jpg',
    'resources/images/skybox/miramar_lf.jpg',
]);
scene.background = environmentMap;

//// WATER ////

let oceanOffset = new Vector2(0.01, 0.001);
//Loading textures
let oceanDisplacementMap = textureLoader.load('resources/images/0001.png');
oceanDisplacementMap.wrapS = RepeatWrapping;
oceanDisplacementMap.wrapT = RepeatWrapping;
oceanDisplacementMap.repeat.set(2, 2);
oceanDisplacementMap.offset = oceanOffset;

let oceanAlphaMap = textureLoader.load('resources/images/alphaMap.png');
oceanAlphaMap.wrapS = RepeatWrapping;
oceanAlphaMap.wrapT = RepeatWrapping;


const waterGeometry = new PlaneGeometry(100, 100, 64, 64);

let waterMaterial = new MeshStandardMaterial({
    transparent: true,
    opacity: 0.8,
    color: 0x014599,
    metalness: 0.0,
    displacementMap: oceanDisplacementMap,
    normalMap: oceanDisplacementMap,
    envMap: environmentMap
});

const water = new Mesh(waterGeometry, waterMaterial);
water.position.y = 3;
water.rotation.x = -Math.PI / 2;
water.castShadow = true;
water.receiveShadow = true;

scene.add(water);

/**
 * Set up camera controller:
 */

const mouseLookController = new MouseLookController(camera);

// We attach a click lister to the canvas-element so that we can request a pointer lock.
// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API

canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

let yaw = 0;
let pitch = 0;
const mouseSensitivity = 0.001;

function updateCamRotation(event) {
    yaw += event.movementX * mouseSensitivity;
    pitch += event.movementY * mouseSensitivity;
}

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        canvas.addEventListener('mousemove', updateCamRotation, false);
    } else {
        canvas.removeEventListener('mousemove', updateCamRotation, false);
    }
});

let move = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    speed: 0.01
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') {
        move.forward = true;
        e.preventDefault();
    } else if (e.code === 'KeyS') {
        move.backward = true;
        e.preventDefault();
    } else if (e.code === 'KeyA') {
        move.left = true;
        e.preventDefault();
    } else if (e.code === 'KeyD') {
        move.right = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') {
        move.forward = false;
        e.preventDefault();
    } else if (e.code === 'KeyS') {
        move.backward = false;
        e.preventDefault();
    } else if (e.code === 'KeyA') {
        move.left = false;
        e.preventDefault();
    } else if (e.code === 'KeyD') {
        move.right = false;
        e.preventDefault();
    }
});

// // instantiate a loader
// const loader = new OBJLoader();

// // load a resource
// loader.load(
//     // resource URL
//     'resources/models/sofa.obj',
//     // called when resource is loaded
//     function (object) {
//         scene.add(object);
//     },
//     // called when loading is in progresses
//     function (xhr) {

//         console.log((xhr.loaded / xhr.total * 100) + '% loaded');

//     },
//     // called when loading has errors
//     function (error) {

//         console.log('An error happened');

//     }
// );

const velocity = new Vector3(0.0, 0.0, 0.0);


let then = performance.now();
function loop(now) {

    oceanOffset.x += 0.001;
    oceanOffset.y += 0.001;

    const delta = now - then;
    then = now;

    const moveSpeed = move.speed * delta;

    velocity.set(0.0, 0.0, 0.0);

    if (move.left) {
        velocity.x -= moveSpeed;
    }

    if (move.right) {
        velocity.x += moveSpeed;
    }

    if (move.forward) {
        velocity.z -= moveSpeed;
    }

    if (move.backward) {
        velocity.z += moveSpeed;
    }

    // update controller rotation.
    mouseLookController.update(pitch, yaw);
    yaw = 0;
    pitch = 0;

    // apply rotation to velocity vector, and translate moveNode with it.

    velocity.applyQuaternion(camera.quaternion);
    camera.position.add(velocity);


    // animate cube rotation:
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // render scene:
    renderer.render(scene, camera);

    requestAnimationFrame(loop);

};

loop(performance.now());