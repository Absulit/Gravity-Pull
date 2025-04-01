import { playAudio } from "./utils.js";

console.log('---- main.js');

const a = playAudio('test', './generative_audio_test.ogg', .5, false, false);


const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', _ => {
    console.log(a);
    a.audio.play();
})


function update() {

    a.analyser?.getByteFrequencyData(a.data);
    // console.log(a.data);


    requestAnimationFrame(update)
}


update();
