import Points from 'points';
import RenderPass from 'renderpass';
import frag0 from './renderpasses/renderpass0/frag.js';
import vert from './renderpasses/renderpass0/vert.js';
import * as dat from 'datgui';
import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';
import { countImageColors } from '../utils.js';

/**
 * @type {Points}
 */
const points = new Points('canvas');
const gui = new dat.GUI({ name: 'Points GUI' });
const folderOptions = gui.addFolder('options');
const folderSongs = gui.addFolder('songs');
const folderColors = gui.addFolder('colors');

const options = {
    sliderA: 0.619,
    sliderB: 0.861,
    sliderC: 0.508,
}

function strToCodes(str) {
    return Array.from(str).map(char => char.charCodeAt(0))
}

const colors = {
    color2: [0, 128, 255], // RGB array

}
folderColors.addColor(colors, 'color2');


let audio = null;
let volume = 1;
let loop = false;
function clickSong() {
    playSong(this, this.file)
}

function playSong(song, file) {
    const audioUrl = URL.createObjectURL(file);
    const name = song?.name || file.name;

    audio && audio.pause() && (audio = null);
    audio = points.setAudio('audio', audioUrl, 1, false, false);
    points.setStorageMap('chars', strToCodes(name));
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.play();
}

function onTimeUpdate() {
    const progress = (audio.currentTime / audio.duration);
    points.setUniform('progress', progress);
}

function readTags(file) {
    return new Promise((resolve, reject) => {
        jsmediatags.read(file, {
            onSuccess: tag => {
                resolve({ tag, file }); // Resolve the promise with the tag data
            },
            onError: error => {
                reject(error); // Reject the promise with the error
            }
        });
    });
}

function loadSong() {


    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3, audio/flac, audio/ogg';

    fileInput.addEventListener('change', async e => {
        audio?.pause();
        const file = e.target.files[0];
        if (file) {
            readTags(file).then(onCompleteTags);
            playSong(null, file);
        }
    });

    fileInput.click();
}

async function onCompleteTags(result) {
    const { tag, file } = result;
    const { title, album, picture } = tag.tags;
    console.log(result);
    let artworkImageUrl = null;
    let artworkColors = null;
    if (picture) {
        const base64String = picture.data.reduce((data, byte) => data + String.fromCharCode(byte), '');
        artworkImageUrl = `data:${picture.format};base64,${btoa(base64String)}`;
        artworkColors = await countImageColors(artworkImageUrl);
        console.log(artworkColors);
        points.setStorageMap('artworkColors', artworkColors.flat());
        points.setUniform('artworkLoaded', 1);
        await db.songs.add({
            file,
            artworkImageUrl,
            artworkColors,
            name: `${title} - ${album}` || file.name
        });
    } else {
        console.log('No album art found.');
    }
    const audioUrl = URL.createObjectURL(file);
    const song = {
        file,
        artworkImageUrl,
        artworkColors,
        name: `${title} - ${album}` || file.name,
        src: audioUrl,
        volume: 1,
        fn: clickSong
    }
    folderSongs.add(song, 'fn').name(song.name);
    points.setStorageMap('chars', strToCodes(song.name));
}

const songs = [
    {
        name: 'Load a song 📀',
        fn: loadSong
    },
    {
        name: 'Pause ⏸️',
        fn: _ => audio?.pause()
    },
    {
        name: 'Pulse 🎵',
        src: './../80s-pulse-synthwave-dude-212407.mp3',
        valume: 1,
        fn: clickSong
    },
    {
        name: 'Robot Swarm 🎵',
        src: './../synthwave-80s-robot-swarm-218092.mp3',
        valume: 1,
        fn: clickSong
    },
    {
        name: 'Fading Echoes 🎵',
        src: './../mezhdunami-fading-echoes-129291.mp3',
        valume: 1,
        fn: clickSong
    }
]

songs.forEach(song => {
    song.controller = folderSongs.add(song, 'fn').name(song.name);
})

//------------------------------------
const db = new Dexie('bhdb');
db.version(1).stores({
    songs: '++id, file'
});

const songsList = await db.songs
    .toArray();

songsList.forEach(item => {
    const { file } = item;
    const audioUrl = URL.createObjectURL(file);
    const song = {
        file,
        name: item.name,
        src: audioUrl,
        volume: 1,
        fn: clickSong
    }
    song.controller = folderSongs.add(song, 'fn').name(item.name);
})
//------------------------------------

Object.keys(options).forEach(key => {
    points.setUniform(key, options[key]);
    folderOptions.add(options, key, -1, 1, .0001).name(key);
})

folderOptions.open();
folderSongs.open();

points.setSampler('imageSampler', null);
points.setSampler('textImageSampler', {
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'nearest',
    //maxAnisotropy: 10,
});
points.setTexture2d('feedbackTexture', true);

audio = points.setAudio('audio', './../80s-pulse-synthwave-dude-212407.mp3', volume, loop, false);

points.setUniform('rand', 0);
points.setUniform('progress', 0);
points.setUniform('artworkLoaded', 0);
points.setUniform('somecolor', colors.color2, 'vec3f');
await points.setTextureImage('font', './src/img/inconsolata_regular_8x22.png');
points.setStorageMap('chars', [15, 14, 8, 13, 19, 18], 'array<f32>')// TODO: setStorageMap doesn't work with u32 wrong sized
points.setStorageMap('artworkColors', [1,1,1,1], 'array<vec4f>');
const renderPasses = [
    new RenderPass(vert, frag0, null),
];

await points.init(renderPasses);

points.fitWindow = true;

document.addEventListener('dblclick', _ => points.fullscreen = !points.fullscreen);

setInterval(_ => {
    console.log('---- 10s');
    points.setUniform('rand', Math.random());
}, 10000)


update();

// call `points.update()` methods to render a new frame
function update() {
    Object.keys(options).forEach(key => points.setUniform(key, options[key]));
    points.setUniform('somecolor', colors.color2.map(i => i / 255))
    points.update();
    requestAnimationFrame(update);
}



