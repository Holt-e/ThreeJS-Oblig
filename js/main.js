import { PerspectiveCamera, WebGLRenderer, Scene, BoxBufferGeometry, MeshBasicMaterial, Mesh } from './lib/three.module.js';

import Utilities from './lib/Utilities.js';
import TerrainBufferGeometry from './terrain/TerrainBufferGeometry.js';

const scene = new Scene();

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new WebGLRenderer();
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);

// add canvas to HTML-document.
document.body.appendChild(renderer.domElement);

const geometry = new BoxBufferGeometry(1, 1, 1);
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);
scene.add(cube);

camera.position.z = 55;
camera.position.y = 15;


// add terrain:
/**
 * We have to wait for the image file to be loaded by the browser.
 * We pass a callback function with the stuff we want to do once the image is loaded.
 * There are many ways to handle asynchronous flow in your application.
 * An alternative way to handle asynchronous functions is async/await
 *  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
 */
Utilities.loadImage('resources/images/heightmap.png').then((heightmapImage) => {

    const terrainGeometry = new TerrainBufferGeometry({
        heightmapImage,
        numberOfSubdivisions: 128
    });

    const terrainMaterial = new MeshBasicMaterial({
        color: 0x777777,
        wireframe: true
    });

    const terrain = new Mesh(terrainGeometry, terrainMaterial);

    scene.add(terrain);

});



function loop() {

    // animate cube rotation:
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // render scene:
    renderer.render(scene, camera);

    requestAnimationFrame(loop);

};

loop();