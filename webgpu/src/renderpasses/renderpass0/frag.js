import { fnusin, fusin } from 'animation';
import { layer, RED, WHITE } from 'color';
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
${WHITE}
${RED}

const NUMCHARS = 128;
const MAXBITS = 256;
const CHLEN = 0.125;

fn pixelateUV(numColumns:f32, numRows:f32, uv:vec2f) -> vec2f {
    let dx = 1 / numColumns;
    let dy = 1 / numRows;
    let coord = vec2(dx*floor( uv.x / dx), dy * floor( uv.y / dy));
    return coord;
}

fn sdfEquiTriangle( position:vec2f, radius:f32, feather: f32, uv:vec2f ) -> f32 {
    var p = uv - position;
    let r = radius;
    let k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y>0.0 ) {
        p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    }
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    let d = -length(p)*sign(p.y);
    let st = 1. - smoothstep(radius, radius + feather, d);
    return st;
}

fn sdfEquiTriangle2( position:vec2f, radius:f32, feather: f32, uv:vec2f ) -> f32 {
    var p = uv - position;
    let r = radius;
    let k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y>0.0 ) {
        p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    }
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    var d = -length(p)*sign(p.y);
    // let st = smoothstep(radius, radius - .1, d);
    var st = 0.;
    if(d > .05 && (.05 + feather) > d){
        st = 1.;
    }
    // st = abs(st) - r;
    return st;
}


// fn opOnion( p: vec2f, r:f32 ) -> f32 {
//   return abs(sdfEquiTriangle(p,r)) - r;
// }

@fragment
fn main(
    @location(0) color: vec4f,
    @location(1) uv: vec2f,
    @location(2) ratio: vec2f,  // relation between params.screen.x and params.screen.y
    @location(3) uvr: vec2f,    // uv with aspect ratio corrected
    @location(4) mouse: vec2f,
    @builtin(position) position: vec4f
) -> @location(0) vec4f {

    let center = vec2(.5) * ratio;

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


    let d2 = center - uvr;
    let d = uvr - center;
    let len = length(d);
    var fadeRotate = 1-d2 * 0.0151;
    var rotDir = 1.;
    if(c6 > .3){
        rotDir = -1;
        fadeRotate = 1-d * 0.0151; // 0.0151 to reduce intensity of d
    }



    let uvrRotate0 = rotateVector(uvr - center, PI * .001) + center; // option 1
    let uvrRotate1 = rotateVector(uvr - center, s) + center; // option 2 s
    let uvrRotate2 = rotateVector(uvr - center, tsq * rotDir) + center; // option 3 t sq

    let uvrPixelated = pixelateUV(100, 100, uvr);

    var uvrRotate = (uvrRotate0 + uvrRotate1 + uvrRotate2) / 3;
    if(c7 > .2){
        uvrRotate = (pixelateUV(100 * c1, 100 * c1, uvr) + (uvrRotate * 3)) / 4;
    }





    let feedbackUV = uvrRotate / fadeRotate;
    let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), feedbackUV, true);



    let height = 0.;
    let l = sdfLine2(vec2(0, height + audioX) * ratio, vec2(1, height + audioX) * ratio, .005, uvr);


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

    let stringColor = stringMask * mix(vec4(1 * fusin(.132) , 1 * fusin(.586) ,0,1), vec4(1,.5, 1 * fusin(.7589633), 1), audio2);

    var equiTriUV = (uvr - center) / 0.31;
    equiTriUV = rotateVector(equiTriUV, TAU * c7);
    let equiTriMask = sdfEquiTriangle2(vec2f(), c2 * .5, .005, equiTriUV);

    //progress bar
    let audioWave = vec4f(l,l*audioX, l*uvrRotate.x, 1);
    let progressBarMask = sdfLine2(vec2(), vec2(params.progress,0) * ratio, .005, uvr);
    let progressBar = vec4f(1,audioX,uvrRotate.x,1) * progressBarMask;
    let triangle = vec4f(1,audioX,uvrRotate.x,1) * equiTriMask;

    let finalColor = layer( audioWave + progressBar + triangle + feedbackColor * .98, stringColor);
    // let finalColor = vec4f(1,s,0,1);

    return finalColor;
    // return vec4(n);
}
`;

export default frag;
