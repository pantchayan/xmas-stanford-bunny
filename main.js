// 
// IMPORTS 
// 
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'

import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

// 
// LOADERS
// 
let gltfLoader = new GLTFLoader();


let samplerFromModel = (model) => {
    let sampler;
    model.traverse((child) => {
        if (child.isMesh) {
            sampler = new MeshSurfaceSampler(child).build()
        }
    })
    return sampler;
}

let bunnySampler;
let bunnyMesh;
gltfLoader.load('assets/models/stanford_bunny_pbr.glb', (gltf) => {
    bunnySampler = samplerFromModel(gltf.scene);
    // makeLines(bunnySampler);
    bunnyMesh = makeSamplePoints(bunnySampler, 10000);
    bunnyMesh.scale.set(0.03, 0.03, 0.03);
    bunnyMesh.position.y = -1;
    scene.add(bunnyMesh);
})

// 
// UTILS 
// 
let sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}
let aspectRatio = sizes.width / sizes.height;
const canvas = document.querySelector('canvas.webgl');

// 
// SCENE 
// 
const scene = new THREE.Scene();
scene.background = new THREE.Color('#424242');
// 
// OBJECTS 
// 
// let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
// let cubeMaterial = new THREE.MeshPhysicalMaterial({ wireframe: true });
// let cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

// scene.add(cubeMesh);

// points.push(new THREE.Vector3(- 10, 0, 0));
// points.push(new THREE.Vector3(0, 10, 0));
// points.push(new THREE.Vector3(10, 0, 0));
let lineGeometry = new THREE.BufferGeometry();

let lineMaterial = new THREE.LineBasicMaterial({ linewidth: 12 });

let line = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);


// 
// SURFACE SAMPLER
// 
let pointsMaterial = new THREE.PointsMaterial(
    {
        color: '#ff69b4',
        size: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        transparent: true,
        alphaMap:
            new THREE.TextureLoader().load('./assets/textures/circle_05.png')
    }
);

let material = new THREE.MeshBasicMaterial();
let geometry = new THREE.SphereGeometry(1, 32, 32);

let makeSamplePoints = (sampler, pointsNum) => {

    let mesh = new THREE.InstancedMesh(geometry, material, pointsNum);
    scene.add(mesh);

    let dummyObj = new THREE.Object3D();
    let vertices = [];
    let tempPosition = new THREE.Vector3();
    for (let i = 0; i < pointsNum; i++) {
        sampler.sample(tempPosition);
        dummyObj.position.set(tempPosition.x, tempPosition.y, tempPosition.z);
        dummyObj.updateMatrix();
        mesh.setMatrixAt(i, dummyObj.matrix);
        mesh.setColorAt(i, new THREE.Color('black'))
    }

    return mesh;
}

// 
// LIGHTS 
// 
let ambientLight = new THREE.AmbientLight('white', 1);
scene.add(ambientLight);

let directionalLight = new THREE.DirectionalLight('white', 6);
directionalLight.position.z = 10;
directionalLight.position.y = 2;
scene.add(directionalLight);

// 
// CAMERA 
// 
let camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.01, 1000);
camera.position.z = 5;
camera.position.y = 1;
// camera.position.x = 3;
scene.add(camera);

// 
// RENDERER 
// 
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);


/**
 * Post processing
 */
const renderTarget = new THREE.WebGLRenderTarget(
    800,
    600,
)

const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const renderPass = new RenderPass(scene, camera);
renderPass.clear = false;
renderPass.autoClear = false;
effectComposer.addPass(renderPass)



const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 3.2
unrealBloomPass.radius = 0.63
unrealBloomPass.threshold = 0.14


effectComposer.addPass(unrealBloomPass);

let sMAAPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio(),
);
effectComposer.addPass(sMAAPass);

// const outputPass = new OutputPass();
// effectComposer.addPass(outputPass);


// 
// GUI Controls 
// 
const gui = new GUI();
let unrealBloomFolder = gui.addFolder('Unreal Bloom')
// let meshMaterialFolder = gui.addFolder('Mesh')

unrealBloomFolder.add(unrealBloomPass, 'strength').min(0).max(5).step(0.001)
unrealBloomFolder.add(unrealBloomPass, 'radius').min(0).max(5).step(0.001)
unrealBloomFolder.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)

gui.add(sMAAPass, 'enabled').name('SMAA')

gui.close()
// let objDebug = {
//     color: '#FF69B4',
//     randomizeColor: () => {
//         material.color.set('white')
//         unrealBloomPass.strength = 0.1;
//         for (let i = 0; i < 10000; i++) {
//             bunnyMesh.setColorAt(i, new THREE.Color('0xFFFFFF' * Math.random()))
//         }
//     }
// }
// lineMaterial.color = new THREE.Color(objDebug.lineColor);

// meshMaterialFolder
//     .addColor(objDebug, 'color')
//     .onChange(() => {
//         pointsMaterial.color.set(objDebug.pointsColor);
//     })

// meshMaterialFolder.add(objDebug, 'randomizeColor')


// 
// CONTROLS 
// 
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 
// RESIZE HANDLE 
// 
window.addEventListener('resize', () => {
    sizes.height = window.innerHeight;
    sizes.width = window.innerWidth;

    renderer.setSize(sizes.width, sizes.height);
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
})

// 
// MOUSE MOVE
// 
let mouse = new THREE.Vector2();
let onDocumentMouseMove = (event) => {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

document.addEventListener('mousemove', onDocumentMouseMove);

// 
// RAYCASTER
// 
const raycaster = new THREE.Raycaster();

// 
// ANIMATION 
// 
let clock = new THREE.Clock();
let animation = () => {
    let elapsedTime = clock.getElapsedTime();

    raycaster.setFromCamera(mouse, camera);
    if (bunnyMesh) {
        const intersection = raycaster.intersectObject(bunnyMesh);

        if (intersection.length > 0) {

            const color = new THREE.Color();
            document.documentElement.style.cursor = 'pointer';

            const instanceId = intersection[0].instanceId;
            bunnyMesh.getColorAt(instanceId, color)
            console.log(instanceId)
            console.log(color)
            // bunnyMesh.getColorAt(instanceId, color);
            // bunnyMesh.setColorAt(instanceId, new THREE.Color('white'));
            if (color.equals(new THREE.Color('black'))) {

                bunnyMesh.setColorAt(instanceId, color.setHex(Math.random() * 0xffffff));

                bunnyMesh.instanceColor.needsUpdate = true;

            }

        }
        else {
            document.documentElement.style.cursor = 'auto';
        }
    }



    controls.update();
    // renderer.render(scene, camera);
    effectComposer.render(elapsedTime)
    requestAnimationFrame(animation);
}

animation()