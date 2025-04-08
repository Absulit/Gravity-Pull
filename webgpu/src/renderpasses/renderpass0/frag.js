import { fnusin } from 'animation';
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

const NUMCHARS = 6;

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
    let audioX = audio.data[ u32(uv.x * audioLength)] / 256;
    let audio0 = audio.data[ u32(.5 * audioLength)] / 256;
    let audio1 = audio.data[ u32(.9 * audioLength)] / 256;
    let audio2 = audio.data[ u32(0 * audioLength)] / 256;

    let maxCircleRadius = .9;

    let n = snoise(uvr * 2 + params.time * .01);
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
    let uvrRotate = (uvrRotate0 + uvrRotate1 + uvrRotate2) / 3;

    // .98 .. 1.0198 X
    // .94 .. 1.02 Y
    // let fadeRotate = vec2f(1, .94 + (.08 * params.rand));
    let fadeRotate = vec2f(1 + (.01 * params.rand), 1.01);
    // let fadeRotate = vec2f(2 * params.sliderA, 1.01);

    // let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvrRotate / vec2f(1.01 * s, 1.01 / s) , true);
    let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvrRotate / fadeRotate, true);



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

    let fontPosition = vec2(0.,0.);
    let charSize = vec2(8u,22u);
    let charSizeF32 = vec2(f32(charSize.x) / params.screen.x, f32(charSize.y) / params.screen.y);
    let charAIndex = 33u; // A

    let chars = array<u32, NUMCHARS>(15,14,8,13,19,18);
    // let fontColor = texturePosition(font, imageSampler, fontPosition, uvr, false);
    var stringColor = vec4(0.);
    for (var index = 0; index < NUMCHARS; index++) {
        let charIndex = chars[index];
        let charPosition = charSizeF32 * vec2(f32(index), 0);
        let space = .001 * vec2(f32(index), 0);
        stringColor += sprite(font, imageSampler, space + fontPosition + charPosition, pixeleduv / 4, charAIndex + charIndex, charSize);
    }















    let finalColor = (stringColor + vec4f(l,l*audioX, l*uvrRotate.x, 1)) * .5 + feedbackColor * .98;
    // let finalColor = vec4f(1,s,0,1);

    return finalColor;
    // return vec4(params.rand,0, 0,1);
}
`;

export default frag;
