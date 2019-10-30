import {
    BoxBufferGeometry,
    CubeTextureLoader,
    DirectionalLight,
    Fog,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneBufferGeometry,
    PlaneGeometry,
    RepeatWrapping,
    Scene,
    Texture,
    TextureLoader,
    UVMapping,
    Vector2,
    WebGLRenderer
} from './lib/three.module.js';

import Utilities from './lib/Utilities.js';
import PhysicsEngine from './lib/PhysicsEngine.js';
import PhysicsObject from './lib/PhysicsObject.js';
import MouseLookController from './controls/MouseLookController.js';

import TextureSplattingMaterial from './materials/TextureSplattingMaterial.js';
import TerrainBufferGeometry from './terrain/TerrainBufferGeometry.js';

let terrainGeometry;
let physicsEngine;

async function main(array, offset) {
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
    const pointLight = new DirectionalLight(0xffffff);
    pointLight.position.y = 100;

    pointLight.castShadow = true;

//Set up shadow properties for the light
    pointLight.shadow.mapSize.width = 1024;  // default
    pointLight.shadow.mapSize.height = 1024; // default
    pointLight.shadow.camera.near = 0.5;    // default
    pointLight.shadow.camera.far = 500;     // default

    scene.add(pointLight);

    let physicsObjects = [];

    const geometry = new BoxBufferGeometry(1, 1, 1);
    const material = new MeshPhongMaterial({color: 0x00ff00});
    const cube = new PhysicsObject(geometry, material);

    physicsObjects.push(cube);

    cube.castShadow = true;
    cube.position.set(0, 15, 0);

    scene.add(cube);
    cube.add(camera);

    pointLight.target = cube;
    camera.position.z = 5;
    camera.position.y = 5;

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
    Utilities.loadImage('resources/images/genHeight.png').then((heightmapImage) => {

        const width = 100;

        terrainGeometry = new TerrainBufferGeometry({
            width,
            heightmapImage,
            numberOfSubdivisions: 1024,
            height: 30
        });
        /*
                //*********Grass Instance ********** DOES NOT WORK YET
                var grassInstance = ImageUtils.loadTexture('resources/texture/grass_03.png');
                var ObjGrass = new MeshBasicMaterial({
                    transparent: true,
                    map: grassInstance
                });
                ObjGrass.depthTest = false;
                ObjGrass.side = DoubleSide;
                var objtree = new Mesh(PlaneGeometry,1,1,ObjGrass);
                objtree.name = "Billboard";
                objtree.receiveShadow = true;
        */
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

        physicsEngine = new PhysicsEngine(physicsObjects, terrainGeometry);
    });

//// ENV MAP ////

    const cubeTextureLoader = new CubeTextureLoader();
    const environmentMap = cubeTextureLoader.load([
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
        oceanDisplacementMap.push(new Texture(waterDisplacementMap[i], UVMapping, RepeatWrapping, RepeatWrapping));
        oceanDisplacementMap[i].repeat.set(10, 10);
        oceanDisplacementMap[i].needsUpdate = true;

    }

    let texLoadOcaen = textureLoader.load('resources/textures/waterAnimated/0001.png');
    let waterMaterial = new MeshStandardMaterial({
        transparent: true,
        opacity: 0.6,
        color: 0x7399c7,
        metalness: 0.3,
        refractionRatio: 0.75,

        roughness: 0.1,
        envMapIntensity: 1.5,
        displacementMap: oceanDisplacementMap[0],
        displacementScale: 1,
        normalMap: oceanDisplacementMap[0],
        envMap: environmentMap
    });

    let waterImageNumber = 0;
    let waterFrameBool = 0;


    const water = new Mesh(waterGeometry, waterMaterial);
    water.position.y = 6;
    water.rotation.x = -Math.PI / 2;
    water.castShadow = true;
    water.receiveShadow = true;

    scene.add(water);

    //************Rain**********

//************Clouds**********

    let cloudParticles = [];
    let cloudLoader = new TextureLoader();
    cloudLoader.load(`resources/images/smoke1.png`,function (texture) {


        let cloudGeo = new PlaneBufferGeometry(600,600);
        let cloudMaterial = new MeshBasicMaterial({
            map: texture,
            transparent: true,
            reflectivity: 1,
            color: 	0x686868,
        });
        for(let p=0; p<50; p++) {
            let cloud = new Mesh(cloudGeo,cloudMaterial);
            cloud.position.set(
                Math.random()*800 -400,
                500,
                Math.random()*500 - 450
            );
            cloud.rotation.x = 1.16;
            cloud.rotation.y = -0.12;
            cloud.rotation.z = Math.random()*360;
            cloud.material.opacity = 0.9;
            cloudParticles.push(cloud);
            scene.add(cloud);
        }
        loop();
    });

    //***********Rain*********

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
        jump: false,
        run: false,
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
        } else if (e.code === 'Space') {
            move.jump = true;
            e.preventDefault();
        } else if (e.code === 'ShiftLeft') {
            move.run = true;
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
        } else if (e.code === 'Space') {
            move.jump = false;
            e.preventDefault();
        } else if (e.code === 'ShiftLeft') {
            move.run = false;
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

    let then = performance.now();

    function loop(now) {
        /*
                frameNumber += 0.05;
                waterFrameBool++;

                oceanOffset.x += 0.001 * Math.sin(frameNumber);
                oceanOffset.y += 0.0007 * Math.sin(-frameNumber);

               if (waterFrameBool === 4) {
                    waterMaterial.displacementMap = oceanDisplacementMap[waterImageNumber];
                    waterMaterial.normalMap = oceanDisplacementMap[waterImageNumber];
                    waterFrameBool = 0;

                }

                waterMaterial.displacementMap.needsUpdate = true;
                waterMaterial.displacementMap.offset = oceanOffset;

               waterMaterial.normalMap.needsUpdate = true;
                waterMaterial.normalMap.offset = oceanOffset;


                waterImageNumber++;
                if (waterImageNumber > 119) {
                    waterImageNumber = 0;
                }
        */
        const delta = now - then;
        then = now;

        if (move.left) {
            cube.acceleration.x = -0.001;
        } else if (move.right) {
            cube.acceleration.x = 0.001;
        } else {
            cube.acceleration.x = 0;
            cube.speed.x = 0;
        }

        if (move.forward) {
            cube.acceleration.z = -0.001;
        } else if (move.backward) {
            cube.acceleration.z = 0.001;
        } else {
            cube.acceleration.z = 0;
            cube.speed.z = 0;
        }

        if (move.jump) {
            cube.acceleration.y = 0.001;
        } else {
            cube.acceleration.y = 0;
            cube.speed.y = 0;
        }

        if (move.run) {
            cube.running = true;
        } else {
            cube.running = false;
        }

        // update controller rotation.
        mouseLookController.update(pitch, yaw);

        yaw = 0;
        pitch = 0;

        //// Physics Engine ////
        physicsEngine.update(delta);

        // render scene:
        renderer.render(scene, camera);

        requestAnimationFrame(loop);

    };

    loop(performance.now());
}

main();