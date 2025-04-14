const compute = /*wgsl*/`

@compute @workgroup_size(8,8,1)
fn main(
    @builtin(global_invocation_id) GlobalId: vec3<u32>,
    @builtin(workgroup_id) WorkGroupID: vec3<u32>,
    @builtin(local_invocation_id) LocalInvocationID: vec3<u32>
) {
    if(params.textureLoaded == 0){
        return;
    }
    let dims = textureDimensions(inputTexture);
    if (GlobalId.x >= dims.x || GlobalId.y >= dims.y) {
        return;
    }

    let color = textureLoad(inputTexture, vec2<i32>(GlobalId.xy), 0);
    let hash = u32(color.r * 255.0) << 16 | u32(color.g * 255.0) << 8 | u32(color.b * 255.0);
    atomicAdd(&outputBuffer[hash % outputBuffer.length()], 1);
}
`;

export default compute;


