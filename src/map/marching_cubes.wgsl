@group(0) @binding(0)
var<storage, read_write> vertexData: array<vec3<f32>>;
@group(0) @binding(1)
var<storage, read_write> indexData: array<u32>;
@group(0) @binding(2)
var<storage, read> casesData: array<u32>;
@group(0) @binding(3)
var<storage, read> fieldData: array<f32>;
@group(0) @binding(4)
var<storage, read> params: Params;
@group(0) @binding(5)
var<storage, read_write> vertexCount: atomic<u32>;
@group(0) @binding(6)
var<storage, read_write> indexCount: atomic<u32>;

struct Params {
    width: u32,
    height: u32,
    depth: u32,
}

const VERTICES = array<vec3<i32>, 8>(vec3<i32>(0, 0, 0), vec3<i32>(1, 0, 0), vec3<i32>(1, 1, 0), vec3<i32>(0, 1, 0), vec3<i32>(0, 0, 1), vec3<i32>(1, 0, 1), vec3<i32>(1, 1, 1), vec3<i32>(0, 1, 1),);

const EDGES = array<vec2<u32>, 12>(vec2<u32>(0, 1), vec2<u32>(1, 2), vec2<u32>(2, 3), vec2<u32>(3, 0), vec2<u32>(4, 5), vec2<u32>(5, 6), vec2<u32>(6, 7), vec2<u32>(7, 4), vec2<u32>(0, 4), vec2<u32>(1, 5), vec2<u32>(2, 6), vec2<u32>(3, 7),);

fn decode_triangle(packed: u32) -> vec3<u32> {
    let edge0 = (packed >> 0u) & 0xFu;
    let edge1 = (packed >> 4u) & 0xFu;
    let edge2 = (packed >> 8u) & 0xFu;
    return vec3<u32>(edge0, edge1, edge2);
}

// Get a triangle from the cases buffer
// casesData is laid out as: [case0_tri0, case0_tri1, ..., case0_tri4, case1_tri0, ...]
fn get_case_triangle(case_idx: u32, tri_idx: u32) -> u32 {
    let offset = case_idx * 5u + tri_idx;
    return casesData[offset];
}

// Get field value at world position
fn get_field_value(wx: u32, wy: u32, wz: u32) -> f32 {
    let idx = wx + wy * params.width + wz * params.width * params.height;
    return fieldData[idx];
}

// Interpolate position along an edge (linear interpolation for now)
fn interpolate_edge(cube_pos: vec3<f32>, edge_idx: u32, values: array<f32, 8>) -> vec3<f32> {
    let edge = EDGES[edge_idx];
    let v0 = VERTICES[edge.x];
    let v1 = VERTICES[edge.y];
    let val0 = values[edge.x];
    let val1 = values[edge.y];
    // Linear interpolation: find where the field crosses 0.5
    let t = (0.5 - val0) / (val1 - val0);
    let t_clamped = clamp(t, 0.0, 1.0);
    let p0 = cube_pos + vec3<f32>(v0);
    let p1 = cube_pos + vec3<f32>(v1);
    return mix(p0, p1, t_clamped);
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    let z = global_id.z;
    if (x >= params.width - 1u || y >= params.height - 1u || z >= params.depth - 1u) {
        return;
    }

    let cube_pos = vec3<f32>(f32(x), f32(y), f32(z));
    // Sample field values at cube corners
    var cube_values: array<f32, 8>;
    var cube_mask: u32 = 0u;
    for (var i: u32 = 0u; i < 8u; i = i + 1u) {
        let v = VERTICES[i];
        let val = get_field_value(x + u32(v.x), y + u32(v.y), z + u32(v.z));
        cube_values[i] = val;
        if (val < 0.5) {
            cube_mask = cube_mask | (1u << i);
        }
    }

    // Process each triangle in this case
    for (var tri_idx: u32 = 0u; tri_idx < 5u; tri_idx = tri_idx + 1u) {
        let packed_tri = get_case_triangle(cube_mask, tri_idx);
        if (packed_tri == 0u) {
            break;
        }

        let edges = decode_triangle(packed_tri);
        // Interpolate vertices along the edges
        let v0 = interpolate_edge(cube_pos, edges.x, cube_values);
        let v1 = interpolate_edge(cube_pos, edges.y, cube_values);
        let v2 = interpolate_edge(cube_pos, edges.z, cube_values);
        // Allocate space for 3 vertices
        let base_vertex = atomicAdd(&vertexCount, 3u);
        // Write vertices
        vertexData[base_vertex] = v0;
        vertexData[base_vertex + 1u] = v1;
        vertexData[base_vertex + 2u] = v2;
        // Write indices
        let base_index = atomicAdd(&indexCount, 3u);
        indexData[base_index] = base_vertex;
        indexData[base_index + 1u] = base_vertex + 1u;
        indexData[base_index + 2u] = base_vertex + 2u;
    }
}