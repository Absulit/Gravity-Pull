import { fnusin, fusin } from 'animation';
import { GREEN, layer, RED, WHITE } from 'color';
import { sprite, texturePosition } from 'image';
import { PI, rotateVector, TAU } from 'math';
import { sdfCircle, sdfLine2, sdfSquare, sdfSegment } from 'sdf';
import { structs } from './structs.js';

const frag = /*wgsl*/`

${structs}
${fnusin}
${sdfSegment}
${sdfLine2}
${texturePosition}
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
${GREEN}

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
    let border = -.05;
    if(d > border && (border + feather) > d){
        st = 1.;
    }
    // st = abs(st) - r;
    return st;
}


// fn opOnion( p: vec2f, r:f32 ) -> f32 {
//   return abs(sdfEquiTriangle(p,r)) - r;
// }

fn sdfRectangle( position0:vec2f, position1:vec2f, uv:vec2f ) -> f32 {
    var r = 0.;
    // if(uv.x > position0.x && uv.x < position1.x && uv.y > position0.y && uv.y < position1.y){
    //     r = 1.;
    // }
    // r = step(position0.x, uv.x) * step(uv.x, position1.x) * step(position0.y, uv.y) * step(uv.y, position1.y);
    r = step(0.0, uv.x - position0.x) * step(0.0, position1.x - uv.x) * step(0.0, uv.y - position0.y) * step(0.0, position1.y - uv.y);
    return r;
}


fn sdRectangle1(position:vec2f, size:vec2f, feather:f32, uv:vec2f) -> f32 {
    let d = abs(uv - position) - size * 0.5;
    let m = max(d.x, d.y);
    var s = smoothstep(0, - feather, m);


    var st = 0.;
    let border = -.05;
    if(m > border && (border + feather) > m){
        st = 1.;
    }
    // st = abs(st) - r;

    return st;
}

fn sdRectangle2(position0:vec2f, position1:vec2f, uv:vec2f) -> f32 {
    let d = max(position0 - uv, uv - position1);
    // If the point is inside the rectangle, return the negative distance to the closest edge
    return length(max(d, vec2f())) + min(max(d.x, d.y), 0.0);
}



const NUMCHARS = 128;
const MAXBITS = 256;
const CHLEN = 0.125;
const DINTENSITY = 0.0151;
const B = vec3(); // black
const DWHITE = vec4f(2); // double white to avoid washed out bg
const TRIROTATION = .00001;
const PIXELATEDSIZE = 100;
const PIMILLI = PI * .001;
const charSize = vec2(8u,22u);
const charOffset = 32u; // A is 33
const maxCircleRadius = .9;
const audioLength = 826.; // 800. 826. 550.

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

    let audioX = audio.data[ u32(uv.x * audioLength)] / MAXBITS;
    let audioX2 = audio.data[ u32(audioLength - uv.x * audioLength)] / MAXBITS;
    let audio1 = audio.data[ u32(.9 * audioLength)] / MAXBITS;

    // CHANNELS
    let c0 = audio.data[ 0 ] / MAXBITS;
    let c1 = audio.data[ u32(CHLEN * 1 * audioLength)] / MAXBITS;
    let c2 = audio.data[ u32(CHLEN * 2 * audioLength)] / MAXBITS;
    let c3 = audio.data[ u32(CHLEN * 3 * audioLength)] / MAXBITS;
    let c4 = audio.data[ u32(CHLEN * 4 * audioLength)] / MAXBITS;
    let c5 = audio.data[ u32(CHLEN * 5 * audioLength)] / MAXBITS;
    let c6 = audio.data[ u32(CHLEN * 6 * audioLength)] / MAXBITS;
    let c7 = audio.data[ u32(CHLEN * 7 * audioLength)] / MAXBITS;


    let s = sdfCircle(center, maxCircleRadius * c4, .1 * audioX, uvr);
    let t = sdfCircle(center, audio1, audio1, uvr);
    let sq = sdfSquare(center, maxCircleRadius * c4, .1 * c4, TAU * audio1, uvr);

    let rectMask = sdRectangle1( center, vec2f(.5,.5) + vec2f(.4 * c0,.4 * c0), .024 /*.0014*/ /*.1 * c1*/, uvr) * step(.001, c0);

    var tsq = t;
    if(params.rand > .5){
        tsq = sq;
    }


    let d2 = center - uvr;
    let d = uvr - center;
    var fadeRotate = 1-d2 * DINTENSITY;
    var rotDir = 1.;
    if(c6 > .3){
        rotDir = -1;
        fadeRotate = 1-d * DINTENSITY; // DINTENSITY to reduce intensity of d
    }

    let uvr_minus_center = d;//uvr - center;
    let uvrRotate0 = rotateVector(uvr_minus_center, PIMILLI) + center; // option 1
    let uvrRotate1 = rotateVector(uvr_minus_center, s) + center; // option 2 s
    let uvrRotate2 = rotateVector(uvr_minus_center, tsq * rotDir) + center; // option 3 t sq
    let uvrRotate3 = rotateVector(uvr_minus_center, rectMask * d2.y * rotDir) + center; // option 4 rect

    var uvrRotate = (uvrRotate0 + uvrRotate1 + uvrRotate2 + uvrRotate3) / 4;
    if(c7 > .2){
        uvrRotate = (pixelateUV(PIXELATEDSIZE * c1, PIXELATEDSIZE * c1, uvr) + (uvrRotate * 4)) / 5;
    }

    let feedbackUV = uvrRotate / fadeRotate;
    let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), feedbackUV, false);

    let height = 0.;
    let lineMask = sdfLine2(vec2(0, height + audioX) * ratio, vec2(1, height + audioX) * ratio, .005, uvr);
    let lineMask2 = sdfLine2(vec2(0, height + audioX2) * ratio, vec2(1, height + audioX2) * ratio, .005, uvr);

    let fontPosition = vec2(.003, 0.) * ratio;
    let charSizeF32 = vec2(f32(charSize.x) / params.screen.x, f32(charSize.y) / params.screen.y);


    var stringMask = 0.;
    var stringMask2 = 0.;
    for (var index = 0; index < NUMCHARS; index++) {
        let charIndex = u32(chars[index]);
        let charPosition = charSizeF32 * vec2(f32(index), 0);
        let space = .002261 * vec2(f32(index), 0);
        stringMask += sprite(font, textImageSampler, space + fontPosition + charPosition, uvr / ( 2.476 + c0), charIndex - charOffset, charSize).x;
        stringMask2 += sprite(font, textImageSampler, space + fontPosition + charPosition, uvr / ( 2.476 + c0) + .0005, charIndex - charOffset, charSize).x;
    }





    var equiTriUV = uvr_minus_center / .156; // .31
    let c2Visible = step(.001, c2); // to revert value only if c2 (triangle) is visible
    variables.triRotation += TRIROTATION * c7 * c6 + c5 * TRIROTATION; // rotate gradually
    variables.triRotation -= .000001 * step(0., variables.triRotation) * c2Visible;
    variables.triRotation = variables.triRotation % TAU; // cap rotation to avoid it getting stuck
    equiTriUV = rotateVector(equiTriUV, variables.triRotation);
    let equiTriMask = sdfEquiTriangle2(vec2f(), 1 - c2 * .5, .007, equiTriUV) * c2Visible;


    let progressBarMask = sdfLine2(vec2(), vec2(params.progress,0) * ratio, .005, uvr);


    // colors of elements
    var colorScheme = u32(params.colorScheme);
    if(colorScheme == 2){
        if(params.artworkLoaded == 0.){
            colorScheme = 0;
        }
    }

    var audioWave = vec4f();
    var audioWave2 = vec4f();
    var progressBar = vec4f();
    var triangle = vec4f();
    var stringColor = vec4f();
    var stringColor2 = vec4f();

    var bg = vec4f();

    switch colorScheme {
        case 0, default { // default colorful
            audioWave = vec4f(lineMask, lineMask*audioX, lineMask*uvrRotate.x, 1);
            audioWave2 = vec4f(lineMask2, lineMask2*audioX2, lineMask2*uvrRotate.x, 1);
            progressBar = vec4f(1,audioX,uvrRotate.x,1) * progressBarMask;
            triangle = vec4f(1,.4 + .1 * c4, step(.5, c2) * .4,1) * equiTriMask;
            stringColor = stringMask * mix(vec4(1 * fusin(.132) , 1 * fusin(.586) ,0,1), vec4(1,.5, 1 * fusin(.7589633), 1), c0);
            stringColor2 = stringMask2 * mix( vec4( 1-vec3(1 * fusin(.132) , 1 * fusin(.586), 0), 1), vec4(1-vec3(1,.5, 1 * fusin(.7589633)), 1), c0);
        }
        case 1 { // matrix
            audioWave = vec4f( vec3f(.129,.145,.039) * lineMask, 1);
            audioWave2 = vec4f( vec3f(.231,.274,.117) * lineMask2, 1);
            progressBar = vec4f( vec3f(.2,.282,.152) * progressBarMask, 1);
            triangle = vec4f( vec3f(.309,.4,.290) * equiTriMask, 1);
            stringColor = vec4f( .572,.717,.549, 1) * stringMask;
            stringColor2 = stringMask2 * GREEN;
        }
        case 2 { // artwork
            audioWave = vec4f( mix(artworkColors[9].rgb, artworkColors[0].rgb, audioX) * lineMask, 1);
            audioWave2 = vec4f( mix(artworkColors[8].rgb, artworkColors[1].rgb,audioX)  * lineMask2, 1);
            progressBar = vec4f( mix(artworkColors[7].rgb, artworkColors[2].rgb, uvrRotate.x)  * progressBarMask, 1);
            triangle = vec4f( mix(artworkColors[6].rgb, artworkColors[3].rgb, c4)  * equiTriMask, 1);
            stringColor = mix(artworkColors[5], artworkColors[4], c0)  * stringMask;
            stringColor2 = stringMask2 * WHITE;
        }
        case 3 { // white bg
            bg = DWHITE;
            audioWave = vec4f( B * (1-lineMask), lineMask);
            audioWave2 = vec4f( B  * (1-lineMask2), lineMask2);
            progressBar = vec4f( B * (1-progressBarMask), progressBarMask);
            triangle = vec4f( B  * (1-equiTriMask), equiTriMask);
            stringColor = vec4f(vec3f(1-stringMask), stringMask);
            stringColor2 = stringMask2 * WHITE;
        }
    }

    var finalColor = layer(audioWave2 + audioWave + progressBar + triangle + feedbackColor * .98, layer(stringColor2, stringColor));
    if(colorScheme == 3){
        finalColor = layer(bg, finalColor);
    }
    // let finalColor = layer(bg, audioWave);
    // let finalColor = vec4f(1,s,0,1);

    return finalColor;
    // return vec4(rect);
}
`;

export default frag;
