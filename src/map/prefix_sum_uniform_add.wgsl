@binding(0) @group(0)
var<storage, read_write> output: array<u32>;
@binding(1) @group(0)
var<storage, read> sums: array<u32>;
const n: u32 = 512;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>, @builtin(local_invocation_id) LocalInvocationId: vec3<u32>, @builtin(workgroup_id) WorkgroupID: vec3<u32>) {
    var thread_id: u32 = LocalInvocationId.x;
    var global_thread_id: u32 = GlobalInvocationID.x;
    output[2 * global_thread_id] += sums[WorkgroupID.x];
    output[2 * global_thread_id + 1] += sums[WorkgroupID.x];

}