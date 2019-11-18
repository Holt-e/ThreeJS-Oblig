import {
    AmbientLight,
    BoxBufferGeometry,
    Clock,
    CubeTextureLoader,
    DirectionalLight,
    DoubleSide,
    Fog,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Raycaster,
    RepeatWrapping,
    Scene,
    Sprite,
    SpriteMaterial,
    Texture,
    TextureLoader,
    UVMapping,
    Vector2,
    Vector3,
    WebGLRenderer
} from './lib/three.module.js';

import Utilities from './lib/Utilities.js';
import PhysicsEngine from './lib/PhysicsEngine.js';
import PhysicsObject from './lib/PhysicsObject.js';
import MouseYawController from './controls/MouseYawController.js';
import TextureSplattingMaterial from './materials/TextureSplattingMaterial.js';
import TerrainBufferGeometry from './terrain/TerrainBufferGeometry.js';
import MousePitchController from "./controls/MousePitchController.js";
import {GLTFLoader} from './loaders/GLTFLoader.js';

export const GRAVITY = -0.016;
export const RAYCAST_HEIGHT = 50;
export const GRASS_AMOUNT = 200;
export const WATER_ANIMATION_ENABLE = false;
export const SPEED_DECAY = 0.6;
export const TERRAIN_SIZE = 200;
export const ROCK_AMOUNT = 100;

let rainDrop;
let rainCount;
let terrainGeometry;
let physicsEngine;

async function main(array, offset) {
    const gltfLoader = new GLTFLoader();
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

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    ambientLight.position.y = 50;
    scene.add(ambientLight);

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

    const geometry = new BoxBufferGeometry(1, 0.3, 1);
    const material = new MeshPhongMaterial({color: 0x000000});

    const cube = new PhysicsObject(geometry, material);

    physicsObjects.push(cube);

    scene.add(cube);
    camera.position.y = 5;
    camera.position.z = 5;
    cube.add(camera);

    pointLight.target = cube;


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
    Utilities.loadImage('resources/images/heightMap.png').then((heightmapImage) => {


        terrainGeometry = new TerrainBufferGeometry({
            width: TERRAIN_SIZE,
            heightmapImage,
            numberOfSubdivisions: 512,
            height: 45
        });

        const grassTexture = new TextureLoader().load('resources/textures/grass_01.jpg');
        grassTexture.wrapS = RepeatWrapping;
        grassTexture.wrapT = RepeatWrapping;
        grassTexture.repeat.set(1000 / TERRAIN_SIZE, 1000 / TERRAIN_SIZE);

        const snowyRockTexture = new TextureLoader().load('resources/textures/snowy_rock_01.png');
        snowyRockTexture.wrapS = RepeatWrapping;
        snowyRockTexture.wrapT = RepeatWrapping;
        snowyRockTexture.repeat.set(1500 / TERRAIN_SIZE, 1500 / TERRAIN_SIZE);


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
        terrain.name = "terrain";
        console.log(terrain)
        scene.add(terrain);

        physicsEngine = new PhysicsEngine(physicsObjects, raycaster, terrain);

        for (let i = 0; i < GRASS_AMOUNT; i++) {
            let j = new Sprite(gressMaterial[Utilities.getRndInt(0, 3)]);
            j.scale.set(6, 6, 6);
            let grassPos = TERRAIN_SIZE / 2
            j.position.x = Utilities.getRnd(-grassPos, grassPos);
            j.position.z = Utilities.getRnd(-grassPos, grassPos);
            raycaster.set(new Vector3(j.position.x, 50, j.position.z), new Vector3(0, -1, 0));

            let intersect = raycaster.intersectObject(terrain);
            if (intersect.length > 0) {
                j.position.y = intersect[0].point.y + 0.5;
            }


            scene.add(j);
        }

        gltfLoader.load(
            "resources/models/Rock.glb",
            (gltf) => {
                let rock = gltf.scene.children[2];
                console.log(rock);
                for (let i = 0; i < ROCK_AMOUNT; i++) {
                    let x = rock.clone();
                    x.castShadow = true;
                    x.name = "rock" + i;
                    x.rotation.z = Math.PI;
                    x.scale.copy(new Vector3(Utilities.getRnd(0.5, 2), Utilities.getRnd(0.5, 2), Utilities.getRnd(0.5, 1)));
                    x.position.copy(Utilities.placeRock(raycaster, terrain));
                    scene.add(x);
                }

            },
        );
        gltfLoader.load(
            "resources/models/Rock1.glb",
            (gltf) => {
                let rock = gltf.scene.children[2];
                console.log(rock);
                for (let i = 0; i < ROCK_AMOUNT; i++) {
                    let x = rock.clone();
                    x.castShadow = true;
                    x.name = "rock" + i + i;
                    x.rotation.z = Math.PI;
                    x.scale.copy(new Vector3(Utilities.getRnd(0.5, 2), Utilities.getRnd(0.5, 2), Utilities.getRnd(0.5, 1)));
                    x.position.copy(Utilities.placeRock(raycaster, terrain));
                    scene.add(x);
                }

            },
        );

    });


//// Gress Sprites ////

    let raycaster = new Raycaster(new Vector3(0, 50, 0), new Vector3(0, -1, 0));

    const gressMaterial = [];
    for (let i = 0; i < 3; i++) {
        let gressSprite = new TextureLoader().load(`resources/textures/grassSprite${i.toString()}.png`)
        gressMaterial.push(new SpriteMaterial({
            map: gressSprite,
            side: DoubleSide,
            transparent: true,
        }));

    }

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
        oceanDisplacementMap[i].repeat.set(2, 2);
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

//************Clouds**********
    /*
            let cloudParticles = [];
            let cloudLoader = new TextureLoader();
            cloudLoader.load(
                'resources/images/smoke1.png',
                (texture) => {


                let cloudGeo = new PlaneBufferGeometry(500,500);
                let cloudMaterial = new MeshBasicMaterial({
                    map: texture,
                    transparent: true,

                });
                for(let p=0; p<60; p++) {
                    let cloud = new Mesh(cloudGeo,cloudMaterial);
                    cloud.position.set(
                        Math.randInt() *800 -400,
                        500,
                        Math.randInt() *500 - 450
                    );
                    cloud.rotation.x = 1.16;
                    cloud.rotation.y = -0.12;
                    cloud.rotation.z = Math.randInt() *360;
                    cloud.material.opacity = 0.6;
                    cloudParticles.push(cloud);
                    scene.add(cloud);
                }
            });

        //***********Rain*********

        let rainGeo = new Geometry();
        for(let i= 0 ; i>rainCount; i++) {
            rainDrop = new Vector3(
                Math.randInt() * 400 - 200,
                Math.randInt() * 500 - 250,
                Math.randInt() * 400 - 200,
            );
            rainDrop.velocity = {};
            rainDrop.velocity = 0;
            rainGeo.vertices.push(rainDrop);
        }

        let rainMaterial = new PointsMaterial({
            color: 0xaaaaaa,
            size:0.1,
            transparent: true
        });
        let rain = new Points(rainGeo,rainMaterial);
        scene.add(rain);
    */
//// FOG ////

    const color = 0x6c7c8a;  // white
    const near = 30;
    const far = 60;
    scene.fog = new Fog(color, near, far);

    //// LOADING OBJECTS ////

    gltfLoader.load(
        "resources/models/scene.gltf",
        (gltf) => {
            let tree = gltf.scene.children[0];
            //console.log(tree);
            tree.scale.set(0.005, 0.005, 0.005);
            tree.name = "car";
            tree.rotation.z = Math.PI;
            tree.castShadow = true;
            cube.add(tree);
        },
    );
    /**
     * Set up camera and cube controller:
     */

    let mouseYawController = new MouseYawController(cube);
    let mousePitchController = new MousePitchController(camera);

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
    let clock = new Clock();
    let frameNumber = 0.0;
    function loop() {

        if (WATER_ANIMATION_ENABLE) {
            frameNumber += 0.05;
            waterFrameBool++;

            oceanOffset.x += 0.001 * Math.sin(frameNumber);
            oceanOffset.y += 0.0007 * Math.sin(-frameNumber);

            waterMaterial.displacementMap = oceanDisplacementMap[waterImageNumber];
            waterMaterial.normalMap = oceanDisplacementMap[waterImageNumber];


            waterMaterial.displacementMap.needsUpdate = true;
            waterMaterial.displacementMap.offset = oceanOffset;

            waterMaterial.normalMap.needsUpdate = true;
            waterMaterial.normalMap.offset = oceanOffset;


            waterImageNumber++;
            if (waterImageNumber > 119) {
                waterImageNumber = 0;
            }
        }


        const delta = clock.getDelta();

        if (move.left) {
            cube.acceleration.x += -0.0001;
        } else if (move.right) {
            cube.acceleration.x += 0.0001;
        } else {
            cube.acceleration.x = 0;
            cube.speed.x = cube.speed.x * SPEED_DECAY;
        }

        if (move.forward) {
            cube.acceleration.z += -0.0001;
        } else if (move.backward) {
            cube.acceleration.z += 0.0001;
        } else {
            cube.acceleration.z = 0;
            cube.speed.z = cube.speed.z * SPEED_DECAY;
        }

        if (move.jump) {
            cube.acceleration.y += 0.0001;
        } else {
            cube.acceleration.y = 0;
            cube.speed.y = cube.speed.y * SPEED_DECAY;
        }

        if (move.run) {
            cube.running = true;
        } else {
            cube.running = false;
        }

        // update controller rotation.
        mouseYawController.update(yaw);
        mousePitchController.update(pitch);

        yaw = 0;
        pitch = 0;

        //// Physics Engine ////
        physicsEngine.update(delta * 1000);

        //*********Cloud Animate**********
        /*
                cloudParticles.forEach(p => {
                    p.rotation.z -=0.002;
                });

                //********Rain Animate*********

                rainGeo.vertices.forEach(p=> {
                p.velocity -= 0.1 + Math.randInt() * 0.1;
                p.y += p.velocity;
                if (p.y < -200) {
                    p.y = 200;
                    p.velocity = 0;
                }
                });
                rainGeo.verticesNeedUpdate = true;
        */

        // render scene:
        renderer.render(scene, camera);

        requestAnimationFrame(loop);

    };

    loop();
}

main();