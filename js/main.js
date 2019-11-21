import {
    BoxBufferGeometry,
    BufferGeometry,
    Clock,
    Color,
    CubeTextureLoader,
    DirectionalLight,
    DoubleSide,
    BufferAttribute,
    Float32BufferAttribute,
    Fog,
    Geometry,
    InstancedBufferAttribute,
    InstancedBufferGeometry,
    LOD,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshStandardMaterial,
    NearestFilter,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneBufferGeometry,
    PlaneGeometry,
    Points,
    PointsMaterial,
    Raycaster,
    RepeatWrapping,
    Scene,
    ShaderMaterial,
    Sprite,
    SpriteMaterial,
    Texture,
    TextureLoader,
    UVMapping,
    Vector3,
    Vector4,
    Shape,
    LineSegments,
    VertexColors,
    WebGLRenderer,
    ExtrudeBufferGeometry,
} from './lib/three.module.js';

import Utilities from './lib/Utilities.js';
import Stats from './lib/stats.module.js';
import PhysicsEngine from './lib/PhysicsEngine.js';
import PhysicsObject from './lib/PhysicsObject.js';
import MouseYawController from './controls/MouseYawController.js';
import TextureSplattingMaterial from './materials/TextureSplattingMaterial.js';
import TerrainBufferGeometry from './terrain/TerrainBufferGeometry.js';
import MousePitchController from "./controls/MousePitchController.js";
import paperplane_vertex from './materials/Paperplanes.js';
import paperplane_fragment from './materials/Paperplanes.js';
import Paperplanes from './materials/Paperplanes.js';
import {GLTFLoader} from './loaders/GLTFLoader.js';


export const GRAVITY = -0.005;
export const RAYCAST_HEIGHT = 1000;
export const GRASS_AMOUNT = 100;
export const WATER_ANIMATION_ENABLE = true;
export const SPEED_DECAY = 0.6;
export const TERRAIN_SIZE = 1000;
export const ROCK_AMOUNT = 50;
export const TREE_AMOUNT = 50;
export const FOG_ENABLE = false;
export const FOG_START = 100;
export const FOG_END = 500;
export const RAIN_COUNT = 10000;
export const SHADOWMAP_SIZE = 1024;

let stats;
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

    const pointLight = new DirectionalLight(0xffffff, 3);
    pointLight.position.y = 200;
    pointLight.position.z = 400;
    pointLight.position.z = 400;
    pointLight.castShadow = true;
//Set up shadow properties for the light
    pointLight.shadow.mapSize.width = SHADOWMAP_SIZE;  // default
    pointLight.shadow.mapSize.height = SHADOWMAP_SIZE; // default
    pointLight.shadow.camera.near = 0.5;    // default
    pointLight.shadow.camera.far = 1000;     // default
    let cameraSize = TERRAIN_SIZE / 2;
    let cameraTopBot = cameraSize / 2
    pointLight.shadow.camera.left = -cameraSize;
    pointLight.shadow.camera.bottom = -cameraTopBot + 50;
    pointLight.shadow.camera.right = cameraSize;
    pointLight.shadow.camera.top = cameraTopBot + 30;
    scene.add(pointLight);
    /*let helper = new PointLightHelper(pointLight, 5);

    scene.add(helper);
*/
    let physicsObjects = [];

    const geometry = new BoxBufferGeometry(1, 0.3, 1);
    const material = new MeshPhongMaterial({color: 0x000000});

    const cube = new PhysicsObject(geometry, material);

    physicsObjects.push(cube);

    scene.add(cube);
    /*
        const headLight = new SpotLight(0xffcccc, 1, 20, Math.PI / 4);
        headLight.position.y = 2;
        headLight.position.z = -2;
        headLight.target.position.z = -20;
        cube.add(headLight);
        cube.add(headLight.target);

     */
    camera.position.y = 5;
    camera.position.z = 5;
    cube.add(camera);


    /**
     * Add terrain:
     *
     * We have to wait for the image file to be loaded by the browser.
     * We pass a callback function with the stuff we want to do once the image is loaded.
     * There are many ways to handle asynchronous flow in your application.
     * An alternative way to handle asynchronous functions is async/await
     *  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
     */


        //******Custom Uniform for shader2******
    const customUniforms = {
            "time": { value: 1.0 }
        };

    //**********Shader Materials Cube***********

    let shader1material = new ShaderMaterial({
        uniforms: customUniforms,
        vertexShader: document.getElementById('vertexShader1').textContent,
        fragmentShader: document.getElementById('fragmentShader1').textContent
    });

    let cubeGeometry = new BoxBufferGeometry(8, 8,8,1,1);
    let cubemesh = new Mesh(cubeGeometry, shader1material);
    cubemesh.position.z = 130;
    cubemesh.position.x = 50;
    cubemesh.position.y = 120;
    scene.add(cubemesh);



    //************Shader Materials************

    let shader2material = new ShaderMaterial({
        uniforms: customUniforms,
        vertexShader: document.getElementById('vertexShader2').textContent,
        fragmentShader: document.getElementById('fragmentShader2').textContent
    });
    var Cube2geometry = new BoxBufferGeometry( 8, 8, 8,1,1 );
    var Cube2mesh = new Mesh( Cube2geometry, shader2material );
    Cube2mesh.position.x = 50;
    Cube2mesh.position.y = 120;
    Cube2mesh.position.z = 100;
    scene.add( Cube2mesh );


//// Terrain ////
    Utilities.loadImage('resources/images/heightMap0.png').then((heightmapImage) => {


        terrainGeometry = new TerrainBufferGeometry({
            width: TERRAIN_SIZE,
            heightmapImage,
            numberOfSubdivisions: 256,
            height: 100
        });

        const grassTexture = new TextureLoader().load('resources/textures/grass_01.jpg');
        grassTexture.wrapS = RepeatWrapping;
        grassTexture.wrapT = RepeatWrapping;
        grassTexture.repeat.set(100000 / TERRAIN_SIZE, 100000 / TERRAIN_SIZE);

        const snowyRockTexture = new TextureLoader().load('resources/textures/rockMoss.png');
        snowyRockTexture.wrapS = RepeatWrapping;
        snowyRockTexture.wrapT = RepeatWrapping;
        snowyRockTexture.repeat.set(100000 / TERRAIN_SIZE, 100000 / TERRAIN_SIZE);


        const splatMap = new TextureLoader().load('resources/images/splatMap.png');

        const terrainMaterial = new TextureSplattingMaterial({
            color: 0x777777,
            shininess: 0,
            textures: [snowyRockTexture, grassTexture],
            splatMaps: [splatMap]
        });

        const terrain = new Mesh(terrainGeometry, terrainMaterial);
        terrain.receiveShadow = true;
        terrain.name = "terrain";
        scene.add(terrain);

        physicsEngine = new PhysicsEngine(physicsObjects, raycaster, terrain);

        for (let i = 0; i < GRASS_AMOUNT; i++) {
            let j = new Sprite(gressMaterial[Utilities.getRndInt(0, 3)]);
            j.scale.set(6, 6, 6);
            let grassPos = TERRAIN_SIZE / 2;
            j.position.x = Utilities.getRnd(-grassPos, grassPos);
            j.position.z = Utilities.getRnd(-grassPos, grassPos);
            raycaster.set(new Vector3(j.position.x, RAYCAST_HEIGHT, j.position.z), new Vector3(0, -1, 0));

            let intersect = raycaster.intersectObject(terrain, true);
            if (intersect.length > 0) {
                j.position.y = intersect[0].point.y + 0.5;
            }
            scene.add(j);
        }
        //// Loading in trees ////
        gltfLoader.load(
            "resources/models/beechTree.glb",
            (gltf) => {
                let treeLOD = new LOD();
                let treeSpriteMap = textureLoader.load("resources/textures/birchTreeLOD.png");
                let treeSpriteMaterial = new SpriteMaterial({
                    alphaTest: 0.5,
                    map: treeSpriteMap,
                    side: DoubleSide,
                    transparent: true,
                });

                let treeSprite = new Sprite(treeSpriteMaterial);
                treeSprite.scale.set(5, 7, 5);
                treeSprite.position.y = 3;
                treeLOD.addLevel(treeSprite, 250);
                let birchTree = gltf.scene.children[2];
                birchTree.traverse(function (child) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                });
                treeLOD.addLevel(birchTree, 0);

                for (let i = 0; i < TREE_AMOUNT; i++) {
                    let x = treeLOD.clone();
                    x.name = "birchTree" + i;
                    x.scale.set(3, 3, 3);
                    x.position.copy(Utilities.placeTree(raycaster, terrain));
                    scene.add(x);
                }

            },
        );
        gltfLoader.load(
            "resources/models/oakTree.glb",
            (gltf) => {
                let treeLOD2 = new LOD();
                let treeSpriteMap2 = textureLoader.load("resources/textures/birchTreeLOD.png");
                let treeSpriteMaterial2 = new SpriteMaterial({
                    alphaTest: 0.5,
                    map: treeSpriteMap2,
                    side: DoubleSide,
                    transparent: true,
                });
                let treeSprite2 = new Sprite(treeSpriteMaterial2);
                treeSprite2.scale.set(15, 15, 15);
                treeSprite2.position.y = 10;
                treeLOD2.addLevel(treeSprite2, 250);
                let oakTree = gltf.scene.children[2];
                oakTree.traverse(function (child) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                });
                treeLOD2.addLevel(gltf.scene.children[2], 0);
                for (let i = 0; i < TREE_AMOUNT; i++) {
                    let x = treeLOD2.clone();
                    x.name = "oakTree" + i;
                    x.position.copy(Utilities.placeTree(raycaster, terrain));
                    scene.add(x);
                }

            },
        );

        gltfLoader.load(
            "resources/models/Rock.glb",
            (gltf) => {
                let rock = gltf.scene.children[2];
                for (let i = 0; i < ROCK_AMOUNT; i++) {
                    let x = rock.clone();
                    x.castShadow = true;
                    x.receiveShadow = true;
                    x.name = "rock" + i;
                    x.rotation.z = Math.PI;
                    x.scale.copy(new Vector3(Utilities.getRnd(1, 5), Utilities.getRnd(1, 5), Utilities.getRnd(1, 5)));
                    x.position.copy(Utilities.placeRock(raycaster, terrain));
                    scene.add(x);
                }

            },
        );

        gltfLoader.load(
            "resources/models/Rock1.glb",
            (gltf) => {
                let rock = gltf.scene.children[2];
                for (let i = 0; i < ROCK_AMOUNT; i++) {
                    let x = rock.clone();
                    x.castShadow = true;
                    x.receiveShadow = true;
                    x.name = "rock" + i + i;
                    x.rotation.z = Math.PI;
                    x.scale.copy(new Vector3(Utilities.getRnd(1, 5), Utilities.getRnd(1, 5), Utilities.getRnd(1, 5)));
                    x.position.copy(Utilities.placeRock(raycaster, terrain));
                    scene.add(x);
                }

            },
        );

    });


    //*******Trails********//

    let colorArray = [new Color(0xff0080), new Color(0xffffff), new Color(0x8000ff)];
    let positionsTrails = [];
    let colorsTrails = [];

    for (let i = 0; i < 100; i++) {
        positionsTrails.push(Utilities.getRnd(-10,10) - 0.5, Utilities.getRnd(-10,10) - 0.5, Utilities.getRnd(-10,10) - 0.5);
        let clr = colorArray[Math.floor(Math.random() * colorArray.length)];
        colorsTrails.push(clr.r, clr.g, clr.b);
    }

    let geometrytrail = new BufferGeometry();
    geometrytrail.setAttribute('position', new Float32BufferAttribute(positionsTrails, 3,));
    geometrytrail.setAttribute('color', new Float32BufferAttribute(colorsTrails, 3));

    let materialtrail = new PointsMaterial({
        size: 8,
        vertexColors: VertexColors,
        depthTest: true,
        sizeAttenuation: false
    });
    let trailmesh = new Points(geometrytrail, materialtrail);

    scene.add(trailmesh);
    trailmesh.position.x =70;
    trailmesh.position.y =110;
    trailmesh.position.z =80;
    stats = new Stats();

//// Gress Sprites ////

    let raycaster = new Raycaster(new Vector3(0, 50, 0), new Vector3(0, -1, 0));

    const gressMaterial = [];
    for (let i = 0; i < 3; i++) {
        let gressSprite = textureLoader.load(`resources/textures/grassSprite${i.toString()}.png`);
        gressMaterial.push(new SpriteMaterial({
            alphaTest: 0.5,
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
    let waterMaterial = new MeshStandardMaterial({
        transparent: true,
        opacity: 0.6,
        color: 0x31728a,
        metalness: 0.3,
        refractionRatio: 0.75,

        roughness: 0.1,
        envMapIntensity: 1,
        displacementMap: oceanDisplacementMap[0],
        displacementScale: 1,
        normalMap: oceanDisplacementMap[0],
        envMap: environmentMap
    });

    let waterImageNumber = 0;

    const water = new Mesh(waterGeometry, waterMaterial);
    water.scale.set(5, 5, 5);
    water.position.y = 15;
    water.position.z = -160;
    water.position.x = -160;
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

//************Clouds**********

    let cloudParticles = [];
    textureLoader.load(
        'resources/images/smoke1.png',
        (texture) => {

            let cloudGeo = new PlaneBufferGeometry(1000, 500);
            let cloudMaterial = new MeshBasicMaterial({
                alphaTest: 0.1,
                map: texture,
                transparent: true,


            });
            for (let p = 0; p < 10; p++) {
                let cloud = new Mesh(cloudGeo, cloudMaterial);
                cloud.position.set(
                    Math.random() * 800 - 400,
                    500,
                    Math.random() * 400 - 450
                );
                cloud.rotation.x = 1.10;
                cloud.rotation.y = -0.10;
                cloud.rotation.z = Math.random() * 360;
                cloud.material.opacity = 0.5;
                cloudParticles.push(cloud);
                scene.add(cloud);
            }
        });

    //***********Rain*********

    let rainGeo = new Geometry();
    for (let i = 0; i < RAIN_COUNT; i++) {
        let rainDrop = new Vector3(
            Math.random() * 400 - 200,
            Math.random() * 500 - 250,
            Math.random() * 400 - 200
        );
        rainDrop.velocity = {};
        rainDrop.velocity = 0;
        rainGeo.vertices.push(rainDrop);
    }
    let rainMaterial = new PointsMaterial({
        color: 0xbbbbbb,
        size: 0.2,
        transparent: true
    });
    let rain = new Points(rainGeo, rainMaterial);
    scene.add(rain);

//// FOG ////
    if (FOG_ENABLE) {
        const color = 0x6c7c8a;
        scene.fog = new Fog(color, FOG_START, FOG_END);
    }

    //// LOADING OBJECTS ////

    gltfLoader.load(
        "resources/models/scene.gltf",
        (gltf) => {
            let car = gltf.scene.children[0];
            //console.log(tree);
            car.scale.set(0.005, 0.005, 0.005);
            car.name = "car";
            car.rotation.z = Math.PI;
            car.traverse(function (child) {
                child.castShadow = true;
            });
            cube.add(car);
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

    function loop(time) {

        if (WATER_ANIMATION_ENABLE) {

            waterMaterial.displacementMap = oceanDisplacementMap[waterImageNumber];
            waterMaterial.normalMap = oceanDisplacementMap[waterImageNumber];

            waterMaterial.displacementMap.needsUpdate = true;

            waterMaterial.normalMap.needsUpdate = true;

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
            cube.acceleration.y = 0.0001;
        } else {
            cube.acceleration.y = 0;
            cube.speed.y *= SPEED_DECAY;
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
//********Trails********//
        stats.update();

        //*********Cloud Animate**********

        cloudParticles.forEach(p => {
            p.rotation.z -= 0.002;
        });

        //********Rain Animate*********
        rainGeo.vertices.forEach(p => {
            p.velocity -= 0.1 + Math.random() * 0.1;
            p.y += p.velocity;
            if (p.y < 1) {
                p.y = 400;
                p.velocity = 0;
            }
        });
        rainGeo.verticesNeedUpdate = true;
        rain.rotation.y += 0.002;

        //*******CubeInstance Animate
        cubemesh.rotation.x  += 0.1;
        cubemesh.rotation.y  += 0.1;
        Cube2mesh.rotation.y += 0.1;
        Cube2mesh.rotation.x += 0.1;
        customUniforms[ "time" ].value += delta * 5;

        // render scene:
        trailmesh.rotation.y += 0.05;
        renderer.render(scene, camera);
        requestAnimationFrame(loop);

    }

    loop();
}

main();