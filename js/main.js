import {
    PerspectiveCamera,
    WebGLRenderer,
    Scene,
    BoxBufferGeometry,
    Mesh,
    MeshBasicMaterial,
    TextureLoader,
    RepeatWrapping,
    PointLight
} from './lib/three.module.js';

import OBJLoader from './loaders/OBJLoader.js';

import Utilities from './lib/Utilities.js';
import MouseLookController from './controls/MouseLookController.js';

import TextureSplattingMaterial from './materials/TextureSplattingMaterial.js';
import TerrainBufferGeometry from './terrain/TerrainBufferGeometry.js';

const scene = new Scene();

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new WebGLRenderer();
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);

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
document.body.appendChild(renderer.domElement);

const geometry = new BoxBufferGeometry(1, 1, 1);
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);
scene.add(cube);

camera.position.z = 55;
camera.position.y = 15;


/**
 * Add terrain:
 * 
 * We have to wait for the image file to be loaded by the browser.
 * We pass a callback function with the stuff we want to do once the image is loaded.
 * There are many ways to handle asynchronous flow in your application.
 * An alternative way to handle asynchronous functions is async/await
 *  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
 */
Utilities.loadImage('resources/images/heightmap.png').then((heightmapImage) => {

    const width = 100;

    const terrainGeometry = new TerrainBufferGeometry({
        width,
        heightmapImage,
        numberOfSubdivisions: 128
    });

    const terrainMaterial = new MeshBasicMaterial({
        color: 0x777777,
        wireframe: true
    });

    // const grassTexture = new TextureLoader().load('resources/textures/grass_01.jpg');
    // grassTexture.wrapS = RepeatWrapping;
    // grassTexture.wrapT = RepeatWrapping;
    // grassTexture.repeat.set(width/80, width/80);

    // const snowyRockTexture = new TextureLoader().load('resources/textures/snowy_rock_01.png');
    // snowyRockTexture.wrapS = RepeatWrapping;
    // snowyRockTexture.wrapT = RepeatWrapping;
    // snowyRockTexture.repeat.set(width/300, width/300);


    // const splatMap = new TextureLoader().load('resources/images/splatmap_01.png');

    // const terrainMaterial = new TextureSplattingMaterial({
    //     color: 0x777777,
    //     shininess: 0,
    //     textures: [grassTexture, snowyRockTexture],
    //     splatMaps: [splatMap]
    // });

    const terrain = new Mesh(terrainGeometry, terrainMaterial);

    scene.add(terrain);

});

/**
 * Set up camera controller:
 */

const mouseLookController = new MouseLookController(camera);

// We attach a click lister to the canvas-element so that we can request a pointer lock.
// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
const canvas = renderer.domElement;

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

/**
 * TODO: add movement with WASD.
 * Hint: You can use camera.getWorldDirection(target),
 * to get a vec3 representing the direction the camera is pointing.
 */

const light = new PointLight();

light.position.z = 3;
light.position.y = 3;

scene.add(light);

// instantiate a loader
const loader = new OBJLoader();

// load a resource
loader.load(
    // resource URL
    'resources/models/sofa.obj',
    // called when resource is loaded
    function (object) {
        scene.add(object);
    },
    // called when loading is in progresses
    function (xhr) {

        console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

        console.log('An error happened');

    }
);


function loop() {
    // update controller rotation.
    mouseLookController.update(pitch, yaw);
    yaw = 0;
    pitch = 0;

    // animate cube rotation:
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // render scene:
    renderer.render(scene, camera);

    requestAnimationFrame(loop);

};

loop();