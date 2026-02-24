@group(0) @binding(0)
var<storage, read> field: array<f32>;
@group(0) @binding(1)
var<storage, read> params: Params;
@group(0) @binding(2)
var<storage, read_write> vertex_counts: array<u32>;
struct Params {
    width: u32,
    height: u32,
    depth: u32,
}

const CASEVertexCounts = array<u32, 256>(0, 3, 3, 6, 3, 6, 6, 9, 3, 6, 6, 9, 6, 9, 9, 6, 3, 6, 6, 9, 6, 9, 9, 12, 6, 9, 9, 12, 9, 12, 12, 9, 3, 6, 6, 9, 6, 9, 9, 12, 6, 9, 9, 12, 9, 12, 12, 9, 6, 9, 9, 6, 9, 12, 12, 9, 9, 12, 12, 9, 12, 15, 15, 6, 3, 6, 6, 9, 6, 9, 9, 12, 6, 9, 9, 12, 9, 12, 12, 9, 6, 9, 9, 12, 9, 12, 12, 15, 9, 12, 12, 15, 12, 15, 15, 12, 6, 9, 9, 12, 9, 12, 6, 9, 9, 12, 12, 15, 12, 15, 9, 6, 9, 12, 12, 9, 12, 15, 9, 6, 12, 15, 15, 12, 15, 6, 12, 3, 3, 6, 6, 9, 6, 9, 9, 12, 6, 9, 9, 12, 9, 12, 12, 9, 6, 9, 9, 12, 9, 12, 12, 15, 9, 6, 12, 9, 12, 9, 15, 6, 6, 9, 9, 12, 9, 12, 12, 15, 9, 12, 12, 15, 12, 15, 15, 12, 9, 12, 12, 9, 12, 15, 15, 12, 12, 9, 15, 6, 15, 12, 6, 3, 6, 9, 9, 12, 9, 12, 12, 15, 9, 12, 12, 15, 6, 9, 9, 6, 9, 12, 12, 15, 12, 15, 15, 6, 12, 9, 15, 12, 9, 6, 12, 3, 9, 12, 12, 15, 12, 15, 9, 12, 12, 15, 15, 6, 9, 12, 6, 3, 6, 9, 9, 6, 9, 12, 6, 3, 9, 6, 12, 3, 6, 3, 3, 0);
const VERTICES = array<vec3<i32>, 8>(vec3<i32>(0, 0, 0), vec3<i32>(1, 0, 0), vec3<i32>(1, 1, 0), vec3<i32>(0, 1, 0), vec3<i32>(0, 0, 1), vec3<i32>(1, 0, 1), vec3<i32>(1, 1, 1), vec3<i32>(0, 1, 1),);
fn get_field_value(x: u32, y: u32, z: u32) -> f32 {
    return field[x + y * params.width + z * params.width * params.height];
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    // Get the voxel coordinates
    let x = global_id.x;
    let y = global_id.y;
    let z = global_id.z;

    // Bounds check
    if (x >= params.width - 1u || y >= params.height - 1u || z >= params.depth - 1u) {
        return;
    }
    // Compute the 1D index for the voxel
    let idx = x + y * (params.width - 1u) + z * (params.width - 1u) * (params.height - 1u);
    var case_index: u32 = 0u;
    for (var i: u32 = 0u; i < 8u; i = i + 1u) {
        let v = VERTICES[i];
        let val = get_field_value(x + u32(v.x), y + u32(v.y), z + u32(v.z));
        if (val < 0.5) {
            case_index = case_index | (1u << i);
        }
    }
    // Lookup the number of vertices for this case
    let vertex_count = CASEVertexCounts[case_index];
    // Store the vertex count
    vertex_counts[idx] = vertex_count;
}

