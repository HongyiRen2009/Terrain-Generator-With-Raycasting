@group(0) @binding(0)
var<storage, read> input: array<f32>;
@group(0) @binding(1)
var<storage, read_write> output: array<f32>;
@group(0) @binding(2)
var<uniform> n: u32;

var<workgroup> temp: array<f32, 512>;

@compute @workgroup_size(256)
fn main(@builtin(local_invocation_id) local_id: vec3<u32>) {
    let tid = local_id.x;
    let gid = tid * 2;

    // Load input into shared memory (temp)
    if (gid < n) {
        temp[gid] = input[gid];
    }
    else {
        temp[gid] = 0.0;
    }
    if (gid + 1 < n) {
        temp[gid + 1] = input[gid + 1];
    }
    else {
        temp[gid + 1] = 0.0;
    }
    workgroupBarrier();

    // Up-sweep (reduce) phase
    var offset = 1u;
    var d = 256u;
    while (d > 0u) {
        workgroupBarrier();
        if (tid < d) {
            let ai = offset * (2u * tid + 1u) - 1u;
            let bi = offset * (2u * tid + 2u) - 1u;
            temp[bi] += temp[ai];
        }
        offset = offset * 2u;
        d = d / 2u;
    }

    // Clear the last element for exclusive scan
    if (tid == 0u) {
        temp[n - 1u] = 0.0;
    }
    workgroupBarrier();

    // Down-sweep phase
    offset = offset / 2u;
    d = 1u;
    while (d < 256u) {
        offset = offset / 2u;
        workgroupBarrier();
        if (tid < d) {
            let ai = offset * (2u * tid + 1u) - 1u;
            let bi = offset * (2u * tid + 2u) - 1u;
            let t = temp[ai];
            temp[ai] = temp[bi];
            temp[bi] += t;
        }
        d = d * 2u;
    }
    workgroupBarrier();

    // Write results
    if (gid < n) {
        output[gid] = temp[gid];
    }
    if (gid + 1 < n) {
        output[gid + 1] = temp[gid + 1];
    }
}