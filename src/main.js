import { playAudio } from "./utils.js";

console.log('---- main.js');

const a = playAudio('test', './generative_audio_test.ogg', .5, false, false);


const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', _ => {
    console.log(a);
    a.audio.play();
})



import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;




function update() {

    a.analyser?.getByteFrequencyData(a.data);
    // console.log(a.data);


    renderer.render(scene, camera);
    // requestAnimationFrame(update)
}
renderer.setAnimationLoop(update);


update();
