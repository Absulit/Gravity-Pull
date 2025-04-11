import { fnusin, fusin } from 'animation';
import { layer } from 'color';
import { sprite, texturePosition } from 'image';
import { PI, rotateVector, TAU } from 'math';
import { snoise } from 'noise2d';
import { sdfCircle, sdfLine2, sdfSquare, sdfSegment } from 'sdf';

const frag = /*wgsl*/`

${fnusin}
${sdfSegment}
${sdfLine2}
${texturePosition}
${snoise}
${sdfCircle}
${sdfSquare}
${rotateVector}
${sprite}
${TAU}
${PI}
${layer}
${fusin}

const NUMCHARS = 128;
const MAXBITS = 256;
const CHLEN = 0.125;

fn pixelateUV(numColumns:f32, numRows:f32, uv:vec2f) -> vec2f {
    let dx = 1 / numColumns;
    let dy = 1 / numRows;
    let coord = vec2(dx*floor( uv.x / dx), dy * floor( uv.y / dy));
    return coord;
}

@fragment
fn main(
    @location(0) color: vec4f,
    @location(1) uv: vec2f,
    @location(2) ratio: vec2f,  // relation between params.screen.x and params.screen.y
    @location(3) uvr: vec2f,    // uv with aspect ratio corrected
    @location(4) mouse: vec2f,
    @builtin(position) position: vec4f
) -> @location(0) vec4f {



    // params.audioLength 1024
    let audioLength = 826.; // 800. 826. 550.
    let audioX = audio.data[ u32(uv.x * audioLength)] / MAXBITS;
    let audio0 = audio.data[ u32(.5 * audioLength)] / MAXBITS;
    let audio1 = audio.data[ u32(.9 * audioLength)] / MAXBITS;
    let audio2 = audio.data[ u32(0 * audioLength)] / MAXBITS;

    // CHANNELS
    let c0 = audio.data[ 0 ] / MAXBITS;
    let c1 = audio.data[ u32(CHLEN * 1 * audioLength)] / MAXBITS;
    let c2 = audio.data[ u32(CHLEN * 2 * audioLength)] / MAXBITS;
    let c3 = audio.data[ u32(CHLEN * 3 * audioLength)] / MAXBITS;
    let c4 = audio.data[ u32(CHLEN * 4 * audioLength)] / MAXBITS;
    let c5 = audio.data[ u32(CHLEN * 5 * audioLength)] / MAXBITS;
    let c6 = audio.data[ u32(CHLEN * 6 * audioLength)] / MAXBITS;
    let c7 = audio.data[ u32(CHLEN * 7 * audioLength)] / MAXBITS;

    let maxCircleRadius = .9;

    let n = (snoise(uvr * 2 - params.time * c4) + 1) * .5;
    let s = sdfCircle(.5 * ratio, maxCircleRadius * audio0, .1 * audioX, uvr);
    let t = sdfCircle(.5 * ratio, audio1, audio1, uvr);
    let sq = sdfSquare(vec2(.5) * ratio, maxCircleRadius * audio0, .1 * audio0, TAU * audio1, uvr);

    // let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvr  * vec2f(1, s), true);

    var tsq = t;
    if(params.rand > .5){
        tsq = sq;
    }

    let center = vec2(.5) * ratio;
    let uvrRotate0 = rotateVector(uvr - center, PI * .001) + center; // option 1
    let uvrRotate1 = rotateVector(uvr - center, s) + center; // option 2 s
    let uvrRotate2 = rotateVector(uvr - center, tsq) + center; // option 3 t sq

    let uvrPixelated = pixelateUV(100, 100, uvr);

    var uvrRotate = (uvrRotate0 + uvrRotate1 + uvrRotate2) / 3;
    if(c7 > .2){
        uvrRotate = (pixelateUV(100 * c1, 100 * c1, uvr) + (uvrRotate * 3)) / 4;
    }

    // .98 .. 1.0198 X
    // .94 .. 1.02 Y
    // let fadeRotate = vec2f(1, .94 + (.08 * params.rand));

    let d = center - uvr;
    let d2 = uvr - center;
    let len = length(d);

    var fadeRotate = 1-d2 * 0.0151;
    // var fadeRotate = vec2f(1 + (.01 * params.rand), 1.01);
    if(c6 > .3){
        fadeRotate = 1-d * 0.0151; // 0.0151 to reduce intensity of d
    }

    // let fadeRotate = vec2f(2 * params.sliderA, 1.01);

    // let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvrRotate / vec2f(1.01 * s, 1.01 / s) , true);

    let feedbackUV = uvrRotate / fadeRotate;
    let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), feedbackUV, true);



    let height = 0.;
    // let uvrRotateLine = rotateVector(uvr, params.time * .01);
    let l = sdfLine2(vec2(0, height + audioX) * ratio, vec2(1, height + audioX) * ratio, .005, uvr);
    // let l = sdfLine2(vec2(0.01, .5) * ratio, vec2(.99, .5) * ratio, .005, uvr);


    let numColumns = 400. * 1; //params.sliderA;
    let numRows = 400. * 1; //params.sliderB;

    let pixelsWidth = params.screen.x / numColumns;
    let pixelsHeight = params.screen.y / numRows;
    let dx = pixelsWidth * (1. / params.screen.x);
    let dy = pixelsHeight * (1. / params.screen.y);
    let pixeleduv = vec2(dx*floor( uvr.x / dx), dy * floor( uvr.y / dy));

    let fontPosition = vec2(.003, 0.) * ratio;
    let charSize = vec2(8u,22u);
    let charSizeF32 = vec2(f32(charSize.x) / params.screen.x, f32(charSize.y) / params.screen.y);
    let charOffset = 32u; // A is 33

    var stringMask = 0.;
    for (var index = 0; index < NUMCHARS; index++) {
        let charIndex = u32(chars[index]);
        let charPosition = charSizeF32 * vec2(f32(index), 0);
        let space = .002261 * vec2(f32(index), 0);
        stringMask += sprite(font, imageSampler, space + fontPosition + charPosition, pixeleduv / ( 2.476 + 2 * audio2), charIndex - charOffset, charSize).x;
    }

    // stringMask = vec4( stringMask.xyz, stringMask.x);
    let stringColor = stringMask * mix(vec4(1 * fusin(.132) , 1 * fusin(.586) ,0,1), vec4(1,.5, 1 * fusin(.7589633), 1), audio2);




    let finalColor =  layer(vec4f(l,l*audioX, l*uvrRotate.x, 1) + feedbackColor * .98, stringColor);
    // let finalColor = vec4f(1,s,0,1);

    return finalColor;
    // return vec4(n);
}
`;

export default frag;
