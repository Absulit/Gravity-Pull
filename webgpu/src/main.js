import Points from 'points';
import RenderPass from 'renderpass';
import frag0 from './renderpasses/renderpass0/frag.js';
import vert from './renderpasses/renderpass0/vert.js';
import * as dat from 'datgui';

/**
 * @type {Points}
 */
const points = new Points('canvas');
const gui = new dat.GUI({ name: 'Points GUI' });
const folderOptions = gui.addFolder('options');
const folderSongs = gui.addFolder('songs');

const options = {
    sliderA: 0.619,
    sliderB: 0.861,
    sliderC: 0.508,
}

function strToCodes(str){
    return Array.from(str).map(char => char.charCodeAt(0))
}


let audio = null;
let volume = 1;
let loop = true;
function playSong() {
    audio && audio.pause() && (audio = null)
    audio = points.setAudio('audio', this.src, audio.volume, loop, false);
    points.setStorageMap('chars', strToCodes(this.name));
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
            points.setStorageMap('chars', strToCodes(file.name));
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
    song.controller = folderSongs.add(song, 'fn').name(song.name);
})


Object.keys(options).forEach(key => {
    points.setUniform(key, options[key]);
    folderOptions.add(options, key, -1, 1, .0001).name(key);
})

folderOptions.open();
folderSongs.open();

points.setSampler('imageSampler', null);
points.setTexture2d('feedbackTexture', true);

audio = points.setAudio('audio', './../80s-pulse-synthwave-dude-212407.mp3', volume, loop, false);

points.setUniform('rand', 0);
await points.setTextureImage('font', './src/img/inconsolata_regular_8x22.png');
points.setStorageMap('chars', [15,14,8,13,19,18],'array<f32>')// TODO: setStorageMap doesn't work with u32 wrong sized

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
