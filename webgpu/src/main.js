
// import the `Points` class

import Points from 'points';
import RenderPass from 'renderpass';
import frag0 from './renderpasses/renderpass0/frag.js';
import vert from './renderpasses/renderpass0/vert.js';

import * as dat from 'datgui';




// reference the canvas in the constructor
/**
 * @type {Points}
 */
const points = new Points('canvas');
const gui = new dat.GUI({ name: 'Points GUI' });
const folder = gui.addFolder('options');

const options = {
    sliderA: 0.619,
    sliderB: 0.861,
    sliderC: 0.508,
}

let audio = null;

let volume = 1;
let loop = true;
function playSong() {
    audio && audio.pause() && (audio = null)
    audio = points.setAudio('audio', this.src, audio.volume, loop, false);
    audio.play();
}

function loadSong() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3, audio/flac, audio/ogg';

    fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const audioUrl = URL.createObjectURL(file);

            audio && audio.pause() && (audio = null);
            audio = points.setAudio('audio', audioUrl, 1, false, false);
            audio.play();

            console.log('Now playing:', file.name);
        }
    });

    fileInput.click();
}

const songs = [
    {
        name: 'Pulse 🎵',
        src: './../80s-pulse-synthwave-dude-212407.mp3',
        valume: 1,
        fn: playSong
    },
    {
        name: 'Robot Swarm 🎵',
        src: './../synthwave-80s-robot-swarm-218092.mp3',
        valume: 1,
        fn: playSong
    },
    {
        name: 'Fading Echoes 🎵',
        src: './../mezhdunami-fading-echoes-129291.mp3',
        valume: 1,
        fn: playSong
    },
    {
        name: 'Load a song',
        fn: loadSong
    }
]
songs.forEach(song => {
    song.controller = gui.add(song, 'fn').name(song.name);
})



Object.keys(options).forEach(key => {
    points.setUniform(key, options[key]);
    folder.add(options, key, -1, 1, .0001).name(key);
})




folder.open();



points.setSampler('imageSampler', null);
points.setTexture2d('feedbackTexture', true);



audio = points.setAudio('audio', './../80s-pulse-synthwave-dude-212407.mp3', volume, loop, false);

// points.setStorage('result', 'array<f32, 10>', 4);
points.setUniform('rand', 0);
// points.setStorage('rand_value', 'vec2f');
// points.setUniform('time_flag', 0)
await points.setTextureImage('font', './src/img/inconsolata_regular_8x22.png');

const renderPasses = [
    new RenderPass(vert, frag0, null),
];

await points.init(renderPasses);

points.fitWindow = true;

setInterval(_ => {
    console.log('---- 10s');
    points.setUniform('rand', Math.random());
}, 10000)


update();

// call `points.update()` methods to render a new frame
function update() {

    Object.keys(options).forEach(key => points.setUniform(key, options[key]));

    points.update();
    requestAnimationFrame(update);
}
