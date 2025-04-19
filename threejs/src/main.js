import * as THREE from 'three/webgpu'
import {
    positionLocal,
    Fn,
    time,
    vec3,
    vec4,
    color,
    texture,
    convertColorSpace,
    abs,
    If,
    rotateUV,
    vec2,
    uniform,
    attribute,
    modelWorldMatrix,
    cameraProjectionMatrix,
    cameraViewMatrix,
    materialNormal,
    modelNormalMatrix,
    normalGeometry,
    normalLocal,
} from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// import * as THREE from 'three'

import { playAudio } from './utils.js';

console.log('---- main.js');

const a = playAudio('test', './../gregorian_chant.mp3', .5, false, false);

const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', _ => {
    console.log(a);
    a.audio.play();
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGPURenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLightColor = 0xFFFFFF;
const intensity = 1;
const light = new THREE.AmbientLight(ambientLightColor, intensity);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10.5);
scene.add(directionalLight)

const targetObject = new THREE.Object3D();
targetObject.position.set(-3, 0, 0)
scene.add(targetObject);

directionalLight.target = targetObject;


const numberOfCubes = 512;
const boxWidth = .01;

let cubes = [];
for (let i = 0; i < numberOfCubes; i++) {
    const geometry = new THREE.BoxGeometry(boxWidth, .1, .1);
    const material = new THREE.MeshLambertMaterial({ color: 0x009900 });
    const cube = new THREE.Mesh(geometry, material);
    cube.material.color.b = i / numberOfCubes;
    // cube.position.z = -i;
    cube.position.x = (i * boxWidth) - 2;
    scene.add(cube);
    cubes.push(cube)
}

function addVertexID(geometry) {
    const vertexCount = geometry.attributes.position.count; // Number of vertices
    const vertexIDs = new Float32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
        vertexIDs[i] = i; // Assign IDs to vertices
    }
    geometry.setAttribute('vertexID', new THREE.BufferAttribute(vertexIDs, 1));
}

const sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
// const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x009900 });
const sphereMaterial = new THREE.NodeMaterial()
// sphereMaterial.fragmentNode = color('crimson').toVar('crimson')
// sphereMaterial.fragmentNode = convertColorSpace(
//     texture(new THREE.TextureLoader().load('https://sbcode.net/img/grid.png')),
//     THREE.SRGBColorSpace,
//     THREE.LinearSRGBColorSpace
// )

addVertexID(sphereGeometry);

// const vertexId = attribute('vertexID', 'float'); // Declare attribute for vertex ID

const data0 = uniform(a.data[10] / 255);
const main = Fn(() => {
    const p = positionLocal.toVar()

    p.assign(rotateUV(p.xy, data0, vec2())) // rotate

    If(abs(p.x).greaterThan(0.45), () => {
        p.z = 1
    })
    If(abs(p.y).greaterThan(0.45), () => {
        p.z = 1
    })
    return p
})

sphereMaterial.fragmentNode = main();

const vertexMain = Fn(() => {

    // const finalVert = modelWorldMatrix.mul(positionLocal).add(data0).toVar();
    // return cameraProjectionMatrix.mul(cameraViewMatrix).mul(finalVert);

    const displacement = 1;
    const newPosition = positionLocal.add(normalLocal.mul(data0));
    return cameraProjectionMatrix.mul(cameraViewMatrix.mul( newPosition ))


    // const id = vertexId.toVar(); // Access vertex ID dynamically
    // const position = positionLocal.toVar();

    // Example: Modifying position based on ID
    // position.x += id.mul(0.01); // Slightly offset x based on ID
    // return position;

})
sphereMaterial.vertexNode = vertexMain();

const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

scene.add(sphere);

camera.position.z = 5;

function update() {
    a.analyser?.getByteFrequencyData(a.data);
    // console.log(a.data);

    cubes.forEach((cube, i) => {
        const val = a.data[i] / 256;
        // console.log(val);
        cube.position.y = val * 4;
        cube.material.color.r = val;
        cube.rotation.y = Math.PI * .5 * val;
        // cube.material.needsUpdate = true;
    })
    data0.value = a.data[0] / 256 * 3.14 * 2;

    renderer.renderAsync(scene, camera);
}
renderer.setAnimationLoop(update);
renderer.debug.getShaderAsync(scene, camera, sphere).then(e => {
    console.log(e.vertexShader)
    console.log(e.fragmentShader)
})

update();
