import { playAudio } from "./utils.js";

console.log('---- main.js');

const a = playAudio('test', './../gregorian_chant.mp3', .5, false, false);

const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', _ => {
    console.log(a);
    a.audio.play();
})

import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGPURenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const color = 0xFFFFFF;
const intensity = 1;
const light = new THREE.AmbientLight(color, intensity);
scene.add(light);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 10.5 );
scene.add( directionalLight )

const targetObject = new THREE.Object3D();
targetObject.position.set(-3,0,0)
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

const sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x009900 });
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

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(update);

update();
