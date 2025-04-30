import { fnusin, fusin } from 'animation';
import { GREEN, layer, RED, RGBAFromHSV, WHITE } from 'color';
import { sprite, texturePosition } from 'image';
import { PHI, PI, rotateVector } from 'math';
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
${PHI}
${PI}
${layer}
${fusin}
${WHITE}
${RED}
${GREEN}
${RGBAFromHSV}

fn pixelateUV(numColumns:f32, numRows:f32, uv:vec2f) -> vec2f {
    let dx = 1 / numColumns;
    let dy = 1 / numRows;
    let coord = vec2(dx*floor( uv.x / dx), dy * floor( uv.y / dy));
    return coord;
}

const SQRT3 = sqrt(3.0);
fn sdfEquiTriangle( position:vec2f, radius:f32, feather: f32, uv:vec2f ) -> f32 {
    var p = uv - position;
    let r = radius;
    let k = SQRT3;
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
    let border = -.05;
    // var st = 0.;
    // if(d > border && (border + feather) > d){
    //     st = 1.;
    // }
    let st = mix(0,1, step(border, d) * step(d, border + feather));
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
    // var s = smoothstep(0, - feather, m);

    let border = -.05;
    // var st = 0.;
    // if(m > border && (border + feather) > m){
    //     st = 1.;
    // }
    let st = mix(0,1, step(border, m) * step(m, border + feather));

    // st = abs(st) - r;

    return st;
}

fn sdfngon(position:vec2f, numSides:f32, radius:f32, feather:f32, uv:vec2f) -> f32 {
    let uv2 = uv - position;
    let angle = atan2(uv2.y, uv2.x);
    let distance = length(uv2);

    let border = -.05;

    let sector = TAU / numSides;
    let d = 1 - cos(floor(0.5 + angle / sector) * sector - angle) * length(uv2) - radius;
    return mix(0,1, step(border, d) * step(d, border + feather));
}

fn sdRectangle2(position0:vec2f, position1:vec2f, uv:vec2f) -> f32 {
    let d = max(position0 - uv, uv - position1);
    // If the point is inside the rectangle, return the negative distance to the closest edge
    return length(max(d, vec2f())) + min(max(d.x, d.y), 0.0);
}

const MATRIX0 = vec3f(.129,.145,.039);
const MATRIX1 = vec3f(.231,.274,.117);
const MATRIX2 = vec3f(.2,.282,.152);
const MATRIX3 = vec3f(.309,.4,.290) ;
const MATRIX4 = vec4f(.572,.717,.549, 1);


const TAU = PI * 2; // TODO: fix on main library
const TAUQUARTER = TAU * .25;
const MAXBYTES = 256;
const CHLEN = 0.125;
const DINTENSITY = .0041;//0.0151;
const B = vec3(); // black
const DWHITE = vec4f(2); // double white to avoid washed out bg
const TRIROTATION = .00001;
const PIXELATEDSIZE = 100;
const PIMILLI = PI * .001;
const FEEDBACKFADE = .98;
const FEEDBACKFADEN = 1-FEEDBACKFADE;
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

    let audioX = audio.data[ u32(uv.x * audioLength)] / MAXBYTES;
    let audioX2 = audio.data[ u32(audioLength - uv.x * audioLength)] / MAXBYTES;
    let audio1 = audio.data[ u32(.9 * audioLength)] / MAXBYTES;

    // CHANNELS
    let c0 = audio.data[ 0 ] / MAXBYTES;
    let c1 = audio.data[ u32(CHLEN * 1 * audioLength)] / MAXBYTES;
    let c2 = audio.data[ u32(CHLEN * 2 * audioLength)] / MAXBYTES;
    let c3 = audio.data[ u32(CHLEN * 3 * audioLength)] / MAXBYTES;
    let c4 = audio.data[ u32(CHLEN * 4 * audioLength)] / MAXBYTES;
    let c5 = audio.data[ u32(CHLEN * 5 * audioLength)] / MAXBYTES;
    let c6 = audio.data[ u32(CHLEN * 6 * audioLength)] / MAXBYTES;
    let c7 = audio.data[ u32(CHLEN * 7 * audioLength)] / MAXBYTES;


    let s = sdfCircle(center, maxCircleRadius * c4, .1 * audioX, uvr);
    let t = sdfCircle(center, audio1, audio1, uvr);
    let sq = sdfSquare(center, maxCircleRadius * c4, .1 * c4, PHI * audio1, uvr);

    let rectMask = sdRectangle1( center, vec2f(.7) + vec2f(.2) * c0, .004 + .020 * c3 /*.0014*/ /*.1 * c1*/, uvr) * step(.001, c0);

    // var tsq = t;
    // if(params.rand > .5){
    //     tsq = sq;
    // }
    var tsq = mix(t, sq, params.rand);

    let d2 = center - uvr;
    let d = uvr - center;


    // if (step(.001, c2) == 1) {
    //     variables.fadePercentage = clamp(variables.fadePercentage + .016, 0.0, 1.0);
    // } else {
    //     variables.fadePercentage = clamp(variables.fadePercentage - .016, 0.0, 1.0);
    // }


    let c6gtp3 = step(.3, c6); // if(c6 > .3)
    // let fadeRotate = mix(1-d2 * DINTENSITY, 1-d * DINTENSITY, c6gtp3);
    // let fadeRotate = mix(1-d2 * DINTENSITY * variables.fadePercentage, 1-d * DINTENSITY * variables.fadePercentage, c6gtp3);
    let fadeRotate = mix( mix(1-d * DINTENSITY, 1-d2 * DINTENSITY, c6gtp3), mix(1-d2 * DINTENSITY, 1-d * DINTENSITY, c6gtp3), smoothstep(0., .1, c2) ) ;
    let rotDir = mix(1., -1, c6gtp3);

    let uvr_minus_center = d;//uvr - center;
    let uvrRotate0 = rotateVector(uvr_minus_center, PIMILLI) + center; // option 1
    let uvrRotate1 = rotateVector(uvr_minus_center, s) + center; // option 2 s
    let uvrRotate2 = rotateVector(uvr_minus_center, tsq * rotDir) + center; // option 3 t sq

    // let uvrRotate3 = ((uvr_minus_center+ rectMask  / rotateVector(vec2(.01), TAU) )+center)  ; // option 4 rect
    let uvrRotate3 = rotateVector(uvr_minus_center, rectMask * PI) + center; // option 4 rect

    var uvrRotate = (uvrRotate0 + uvrRotate1 + uvrRotate2 + uvrRotate3) / 4;
    if(c7 > .2){
        uvrRotate = (pixelateUV(PIXELATEDSIZE * c1, PIXELATEDSIZE * c1, uvr) + (uvrRotate * 4)) / 5;
    }

    // var uvrRotateMix0 = (uvrRotate0 + uvrRotate1 + uvrRotate2 + uvrRotate3) / 4;
    // let uvrRotateMix1 = (pixelateUV(PIXELATEDSIZE * c1, PIXELATEDSIZE * c1, uvr) + (uvrRotateMix0 * 4)) / 5;
    // let uvrRotate = mix(uvrRotateMix0, uvrRotateMix1, step(.2, c7));

    let feedbackUV = ((uvrRotate + center) / fadeRotate) - center;
    var feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), feedbackUV, false);
    feedbackColor = mix(feedbackColor, vec4f(), FEEDBACKFADEN);
    feedbackColor = feedbackColor * step(.01, feedbackColor.a);

    let height = 0.;
    let heightM1 = height + audioX;
    let heightM2 = height + audioX2;
    let lineMask = sdfLine2(vec2(0, heightM1) * ratio, vec2(1, heightM1) * ratio, .005, uvr);
    let lineMask2 = sdfLine2(vec2(0, heightM2) * ratio, vec2(1, heightM2) * ratio, .005, uvr);

    let fontPosition = vec2(.003, 0.) * ratio;
    let charSizeF32 = vec2(f32(charSize.x) / params.screen.x, f32(charSize.y) / params.screen.y);


    var stringMask = 0.;
    var stringMask2 = 0.;
    let textScale = 2.476 * ratio.y + c0;
    let textUVR = uvr / textScale;
    let spaceRatio = .0017 * ratio.x;

    for (var index = 0; index < i32(params.numChars); index++) {
        let indexF32 = f32(index);
        let charIndex = u32(chars[index]);
        let charPosition = charSizeF32 * vec2(indexF32, 0);
        let space = spaceRatio * vec2(indexF32, 0);
        let sfPcP = space + fontPosition + charPosition;
        let cIcO = charIndex - charOffset;
        stringMask += sprite(font, textImageSampler, sfPcP, textUVR, cIcO, charSize).x;
        stringMask2 += sprite(font, textImageSampler, sfPcP, textUVR + .0005, cIcO, charSize).x;
    }

    var messageStringMask = 0.;
    if(params.showMessage == 1.){
        let messagePosition = vec2(.15, .19) * ratio;
        for (var index = 0; index < 21; index++) {
            let indexF32 = f32(index);
            let charIndex = u32(message[index]);
            let charPosition = charSizeF32 * vec2(indexF32, sin(params.time + indexF32 * .1));
            let space = spaceRatio * vec2(indexF32, 0);
            messageStringMask += sprite(font, textImageSampler, space + messagePosition + charPosition, textUVR, charIndex - charOffset, charSize).x;
        }
    }


    let minNumSides = 3.;
    let numSides = minNumSides + floor(5 * c7);
    var equiTriUV = uvr_minus_center / .156 * minNumSides / numSides; // .31
    let c2Visible = step(.001, c2); // to revert value only if c2 (poligon) is visible
    variables.triRotation += c3 * TAU * TRIROTATION * step(.38, c3); // rotate gradually
    variables.triRotation -= .000001 * TAU * step(0., variables.triRotation) * c2Visible;
    variables.triRotation = variables.triRotation % TAU; // cap rotation to avoid it getting stuck
    equiTriUV = rotateVector(equiTriUV, variables.triRotation + TAUQUARTER);
    let poliMask = sdfngon(vec2f(), numSides, .5 + (c2 * .25), .01, equiTriUV) * c2Visible;

    let progressBarMask = sdfLine2(vec2(), vec2(params.progress,0) * ratio, .005, uvr);


    // colors of elements
    var colorScheme = u32(params.colorScheme);
    if(colorScheme == 2 && params.artworkLoaded == 0.){
        colorScheme = 0;
    }

    var audioWave = vec4f();
    var audioWave2 = vec4f();
    var progressBar = vec4f();
    var poligon = vec4f();
    var stringColor = vec4f();
    var stringColor2 = vec4f();

    var bg = vec4f();

    switch colorScheme {
        case 0, default { // default colorful
            audioWave = vec4f(lineMask, lineMask*audioX, lineMask*uvrRotate.x, 1);
            audioWave2 = vec4f(lineMask2, lineMask2*audioX2, lineMask2*(1-uvrRotate.y), 1);
            progressBar = vec4f(1,audioX,uvrRotate.x,1) * progressBarMask;
            poligon = vec4f(1, .4 + .1 * c4, step(.5, c2) * .4, 1) * poliMask;
            stringColor = stringMask * mix(vec4(fusin(.132) , fusin(.586) ,0,1), vec4(1,.5, fusin(.7589633), 1), c0);
            stringColor2 = stringMask2 * mix( vec4( 1-vec3(fusin(.132) , fusin(.586), 0), 1), vec4(1-vec3(1,.5, fusin(.7589633)), 1), c0);
        }
        case 1 { // matrix
            audioWave = vec4f(MATRIX0 * lineMask, 1);
            audioWave2 = vec4f(MATRIX1 * lineMask2, 1);
            progressBar = vec4f(MATRIX2 * progressBarMask, 1);
            poligon = vec4f(MATRIX3 * poliMask, 1);
            stringColor = MATRIX4 * stringMask;
            stringColor2 = stringMask2 * GREEN;
        }
        case 2 { // artwork
            audioWave = vec4f( mix(artworkColors[9].rgb, artworkColors[0].rgb, audioX) * lineMask, 1);
            audioWave2 = vec4f( mix(artworkColors[8].rgb, artworkColors[1].rgb,audioX) * lineMask2, 1);
            progressBar = vec4f( mix(artworkColors[7].rgb, artworkColors[2].rgb, uvrRotate.x) * progressBarMask, 1);
            poligon = vec4f( mix(artworkColors[6].rgb, artworkColors[3].rgb, c4) * poliMask, 1);
            stringColor = mix(artworkColors[5], artworkColors[4], c0) * stringMask;
            stringColor2 = stringMask2 * WHITE;
        }
        case 3 { // white bg
            bg = DWHITE;
            audioWave = vec4f( B * (1-lineMask), lineMask);
            audioWave2 = vec4f( B  * (1-lineMask2), lineMask2);
            progressBar = vec4f( B * (1-progressBarMask), progressBarMask);
            poligon = vec4f( B  * (1-poliMask), poliMask);
            stringColor = vec4f(vec3f(1-stringMask), stringMask);
            stringColor2 = stringMask2 * WHITE;
        }
        case 4 { // rainbow
            audioWave = RGBAFromHSV(lineMask * c0, lineMask * c1, lineMask * c2);
            audioWave2 = RGBAFromHSV(lineMask2 * c3, lineMask2 * c4, lineMask2 * c4);
            progressBar = RGBAFromHSV(progressBarMask * c4, progressBarMask * c3, progressBarMask * c1);
            poligon = RGBAFromHSV(poliMask * uvrRotate.x, poliMask * uvrRotate.y, poliMask);
            stringColor = stringMask * RGBAFromHSV(stringMask * c5, stringMask * c0, stringMask * c7);
            stringColor2 = stringMask2 * WHITE;
        }
    }



    var finalColor = layer(audioWave2 + audioWave + progressBar + poligon + feedbackColor, layer(stringColor2, stringColor));
    if(colorScheme == 3){
        finalColor = layer(bg, finalColor);
    }
    // let finalColor = layer(bg, audioWave);
    // let finalColor = vec4f(1,s,0,1);

    return finalColor + (messageStringMask * WHITE * params.showMessage * .1);
    // return finalColor + (poliMask * WHITE * params.showMessage * .1);
    // return poliMask * WHITE;
}
`;

export default frag;
