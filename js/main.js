import {
    BoxBufferGeometry,
    CubeTextureLoader,
    DataTextureLoader,
    DirectionalLight,
    Fog,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    RepeatWrapping,
    Scene,
    Texture,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer
} from './lib/three.module.js';

import Utilities from './lib/Utilities.js';
import MouseLookController from './controls/MouseLookController.js';

import TextureSplattingMaterial from './materials/TextureSplattingMaterial.js';
import TerrainBufferGeometry from './terrain/TerrainBufferGeometry.js';

async function main() {
    const textureLoader = new TextureLoader();
    const dataTextureLoader = new DataTextureLoader();
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
    const pointLight = new DirectionalLight(0xffffff);
    pointLight.position.y = 100;

    pointLight.castShadow = true;

//Set up shadow properties for the light
    pointLight.shadow.mapSize.width = 1024;  // default
    pointLight.shadow.mapSize.height = 1024; // default
    pointLight.shadow.camera.near = 0.5;    // default
    pointLight.shadow.camera.far = 500;     // default

    scene.add(pointLight);


    const geometry = new BoxBufferGeometry(1, 1, 1);
    const material = new MeshPhongMaterial({color: 0x00ff00});
    const cube = new Mesh(geometry, material);

    cube.castShadow = true;
    cube.position.set(0, 15, 0);

    scene.add(cube);

    pointLight.target = cube;
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
            height: 20
        });

        const grassTexture = new TextureLoader().load('resources/textures/grass_01.jpg');
        grassTexture.wrapS = RepeatWrapping;
        grassTexture.wrapT = RepeatWrapping;
        grassTexture.repeat.set(1000 / width, 1000 / width);

        const snowyRockTexture = new TextureLoader().load('resources/textures/snowy_rock_01.png');
        snowyRockTexture.wrapS = RepeatWrapping;
        snowyRockTexture.wrapT = RepeatWrapping;
        snowyRockTexture.repeat.set(1500 / width, 1500 / width);


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
        'resources/images/skybox/miramar_ft.png',
        'resources/images/skybox/miramar_bk.png',
        'resources/images/skybox/miramar_up.png',
        'resources/images/skybox/miramar_dn.png',
        'resources/images/skybox/miramar_rt.png',
        'resources/images/skybox/miramar_lf.png',
    ]);
    scene.background = environmentMap;

//// WATER ////

    let oceanOffset = new Vector2(0.01, 0.001);
//Loading textures


    const waterGeometry = new PlaneGeometry(100, 100, 64, 64);


    let promises = [];

    for (let i = 1; i < 121; i++) {
        promises.push(Utilities.loadImage(`resources/textures/waterAnimated/${i.toString().padStart(4, '0')}.png`))

    }

    let waterDisplacementMap = await Promise.all(promises);

    let oceanDisplacementMap = [];

    for (let i = 0; i < 120; i++) {
        oceanDisplacementMap.push(new Texture(waterDisplacementMap[4], RepeatWrapping, RepeatWrapping));
        oceanDisplacementMap[i].repeat.set(2, 2);

    }
    console.log(oceanDisplacementMap[0])

    let waterMaterial = new MeshStandardMaterial({
        transparent: true,
        opacity: 0.6,
        color: 0x7399c7,
        metalness: 0.3,
        roughness: 0.1,
        envMapIntensity: 1.5,
        displacementMap: oceanDisplacementMap[0],
        normalMap: oceanDisplacementMap[0],
        envMap: environmentMap
    });

    let waterImageNumber = 0;


    const water = new Mesh(waterGeometry, waterMaterial);
    water.position.y = 3;
    water.rotation.x = -Math.PI / 2;
    water.castShadow = true;
    water.receiveShadow = true;

    scene.add(water);

//// FOG ////

    const color = 0x6c7c8a;  // white
    const near = 30;
    const far = 60;
    scene.fog = new Fog(color, near, far);

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
        waterMaterial.displacementMap = oceanDisplacementMap[waterImageNumber];
        waterMaterial.normalMap = oceanDisplacementMap[waterImageNumber];

        waterImageNumber++;
        if (waterImageNumber > 120) {
            waterImageNumber = 0;
        }
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
}

main();