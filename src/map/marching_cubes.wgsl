@group(0) @binding(0)
var<storage, read_write> interleavedData: array<vec4<f32>>; // vec4: xyz + terrain_type
@group(0) @binding(1)
var<storage, read_write> indexData: array<u32>;
@group(0) @binding(2)
var<storage, read> fieldData: array<f32>;
@group(0) @binding(3)
var<storage, read> params: Params;
@group(0) @binding(4)
var<storage, read> vertexOffsets: array<u32>;

struct Params {
    width: u32,
    height: u32,
    depth: u32,
}

const VERTICES = array<vec3<f32>, 8>(
    vec3<f32>(0.0, 0.0, 0.0), 
    vec3<f32>(1.0, 0.0, 0.0), 
    vec3<f32>(1.0, 1.0, 0.0), 
    vec3<f32>(0.0, 1.0, 0.0), 
    vec3<f32>(0.0, 0.0, 1.0), 
    vec3<f32>(1.0, 0.0, 1.0), 
    vec3<f32>(1.0, 1.0, 1.0), 
    vec3<f32>(0.0, 1.0, 1.0),
);
const EDGES = array<vec2<u32>, 12>(vec2<u32>(0, 1), vec2<u32>(1, 2), vec2<u32>(2, 3), vec2<u32>(3, 0), vec2<u32>(4, 5), vec2<u32>(5, 6), vec2<u32>(6, 7), vec2<u32>(7, 4), vec2<u32>(0, 4), vec2<u32>(1, 5), vec2<u32>(2, 6), vec2<u32>(3, 7),);
const CASES = array<u32, 256 * 5>(0, 0, 0, 0, 0, 776, 0, 0, 0, 0, 2305, 0, 0, 0, 0, 792, 408, 0, 0, 0, 298, 0, 0, 0, 0, 776, 673, 0, 0, 0, 41, 681, 0, 0, 0, 643, 2690, 2442, 0, 0, 2851, 0, 0, 0, 0, 2080, 2226, 0, 0, 0, 2305, 946, 0, 0, 0, 402, 667, 2968, 0, 0, 2979, 2579, 0, 0, 0, 161, 2208, 2984, 0, 0, 944, 185, 2490, 0, 0, 2968, 2715, 0, 0, 0, 2119, 0, 0, 0, 0, 115, 71, 0, 0, 0, 2119, 25, 0, 0, 0, 1049, 1812, 791, 0, 0, 2119, 2578, 0, 0, 0, 1844, 772, 2578, 0, 0, 2562, 2704, 2119, 0, 0, 1193, 932, 675, 1844, 0, 1924, 2851, 0, 0, 0, 2887, 587, 66, 0, 0, 2305, 946, 1144, 0, 0, 434, 2481, 1977, 1145, 0, 442, 315, 1924, 0, 0, 1796, 2567, 2576, 2983, 0, 2119, 944, 185, 2490, 0, 1972, 1209, 2490, 0, 0, 1353, 0, 0, 0, 0, 1353, 2096, 0, 0, 0, 336, 1344, 0, 0, 0, 2100, 1077, 1329, 0, 0, 1173, 298, 0, 0, 0, 776, 673, 2388, 0, 0, 1354, 2626, 576, 0, 0, 675, 936, 2213, 2132, 0, 1353, 571, 0, 0, 0, 523, 139, 1353, 0, 0, 1045, 1025, 571, 0, 0, 1045, 2836, 2849, 2228, 0, 2979, 2579, 1173, 0, 0, 1353, 161, 2208, 2984, 0, 1029, 1291, 59, 1466, 0, 1189, 2212, 2984, 0, 0, 1401, 1929, 0, 0, 0, 2384, 83, 855, 0, 0, 120, 368, 1393, 0, 0, 855, 339, 0, 0, 0, 2135, 2197, 2578, 0, 0, 298, 2384, 83, 855, 0, 40, 2085, 1322, 2135, 0, 2610, 1338, 1845, 0, 0, 1401, 1929, 571, 0, 0, 2336, 1833, 2855, 1401, 0, 2851, 120, 368, 1393, 0, 539, 2839, 1813, 0, 0, 2835, 2587, 2424, 1401, 0, 123, 87, 149, 186, 161, 2640, 1392, 1920, 2976, 944, 1466, 1403, 0, 0, 0, 2661, 0, 0, 0, 0, 776, 1626, 0, 0, 0, 400, 2661, 0, 0, 0, 792, 408, 1626, 0, 0, 609, 1617, 0, 0, 0, 1318, 1298, 776, 0, 0, 2405, 105, 608, 0, 0, 2437, 1410, 643, 1318, 0, 2851, 1626, 0, 0, 0, 2080, 2226, 2661, 0, 0, 2851, 400, 1626, 0, 0, 2661, 402, 667, 2968, 0, 1595, 1334, 309, 0, 0, 1675, 390, 129, 1302, 0, 2309, 1286, 1539, 1595, 0, 1430, 1691, 2968, 0, 0, 2119, 1446, 0, 0, 0, 115, 71, 1626, 0, 0, 2119, 1446, 25, 0, 0, 2661, 1049, 1812, 791, 0, 609, 1617, 2119, 0, 0, 1302, 1554, 1136, 115, 0, 1924, 2405, 105, 608, 0, 2354, 2419, 2375, 2342, 2405, 946, 2119, 1626, 0, 0, 1446, 2887, 587, 66, 0, 2305, 1144, 2851, 2661, 0, 2337, 2857, 1209, 1972, 2661, 2119, 1595, 1334, 309, 0, 267, 75, 1147, 1307, 1627, 1430, 1680, 1547, 2819, 1924, 2405, 2921, 1977, 1145, 0, 2468, 2660, 0, 0, 0, 1610, 1178, 776, 0, 0, 2561, 1546, 1030, 0, 0, 792, 2070, 422, 2148, 0, 297, 2340, 1062, 0, 0, 131, 297, 2340, 1062, 0, 576, 1602, 0, 0, 0, 808, 2084, 1062, 0, 0, 2468, 2660, 946, 0, 0, 651, 130, 1190, 2468, 0, 946, 2561, 1546, 1030, 0, 328, 356, 422, 395, 434, 2835, 1051, 1169, 1611, 0, 438, 395, 264, 356, 329, 2819, 1547, 1030, 0, 0, 2228, 2916, 0, 0, 0, 1926, 1674, 2697, 0, 0, 115, 2672, 2663, 2464, 0, 2657, 352, 103, 120, 0, 1562, 1814, 791, 0, 0, 393, 1665, 1926, 609, 0, 1657, 1849, 777, 617, 297, 2151, 104, 608, 0, 0, 611, 1651, 0, 0, 0, 2851, 1926, 1674, 2697, 0, 151, 2471, 2663, 519, 2855, 416, 166, 104, 2151, 946, 2657, 359, 379, 434, 0, 1681, 1673, 1656, 1555, 1595, 265, 1659, 0, 0, 0, 944, 182, 103, 120, 0, 2919, 0, 0, 0, 0, 1899, 0, 0, 0, 0, 131, 1899, 0, 0, 0, 2305, 2934, 0, 0, 0, 2353, 2435, 2934, 0, 0, 298, 2934, 0, 0, 0, 298, 131, 2934, 0, 0, 41, 681, 1899, 0, 0, 1899, 643, 2690, 2442, 0, 866, 886, 0, 0, 0, 1896, 2144, 98, 0, 0, 1575, 567, 2305, 0, 0, 1944, 663, 402, 1575, 0, 2582, 1559, 1811, 0, 0, 1800, 1543, 262, 2582, 0, 1591, 2358, 2307, 2710, 0, 1671, 2694, 2442, 0, 0, 1208, 1131, 0, 0, 0, 779, 2822, 1540, 0, 0, 2886, 2948, 2305, 0, 0, 2353, 1593, 1715, 1129, 0, 1208, 1131, 673, 0, 0, 673, 779, 2822, 1540, 0, 2706, 656, 1716, 1208, 0, 2371, 1123, 1715, 2707, 675, 2083, 1064, 1572, 0, 0, 66, 582, 0, 0, 0, 400, 2083, 1064, 1572, 0, 2337, 1065, 1572, 0, 0, 314, 2612, 900, 2630, 0, 266, 2566, 1540, 0, 0, 1699, 2707, 2307, 1123, 2115, 1193, 1130, 0, 0, 0, 1353, 1719, 0, 0, 0, 1353, 1719, 2096, 0, 0, 336, 1344, 2934, 0, 0, 1899, 2100, 1077, 1329, 0, 673, 1353, 2934, 0, 0, 776, 2388, 298, 1899, 0, 1719, 1354, 2626, 576, 0, 808, 2090, 2212, 1189, 1899, 866, 886, 1353, 0, 0, 1173, 1896, 2144, 98, 0, 1591, 566, 84, 336, 0, 536, 344, 1352, 1576, 1896, 1353, 2582, 1559, 1811, 0, 1671, 134, 2566, 266, 1173, 2563, 2624, 2644, 2615, 2678, 1896, 2154, 2213, 2132, 0, 1685, 2966, 2203, 0, 0, 875, 99, 1376, 2384, 0, 184, 1456, 1717, 336, 0, 2870, 1589, 1329, 0, 0, 298, 1685, 2966, 2203, 0, 179, 1712, 2400, 1385, 673, 1408, 1464, 1387, 1282, 1322, 875, 1379, 2643, 675, 0, 2195, 918, 1685, 866, 0, 1385, 2400, 98, 0, 0, 2134, 2069, 2049, 2146, 2083, 354, 342, 0, 0, 0, 902, 2198, 2390, 310, 2582, 161, 1696, 1376, 2384, 0, 2051, 2646, 0, 0, 0, 1386, 0, 0, 0, 0, 2741, 2933, 0, 0, 0, 2741, 2933, 131, 0, 0, 1963, 1882, 400, 0, 0, 2677, 2938, 2073, 792, 0, 2834, 1819, 1303, 0, 0, 131, 2834, 1819, 1303, 0, 2818, 1291, 2309, 1883, 0, 1426, 2434, 2098, 1874, 2930, 570, 2613, 1335, 0, 0, 522, 2567, 1800, 2677, 0, 400, 570, 2613, 1335, 0, 647, 664, 537, 629, 602, 1811, 1303, 0, 0, 0, 2160, 113, 373, 0, 0, 89, 848, 1875, 0, 0, 2421, 2439, 0, 0, 0, 1444, 1192, 2219, 0, 0, 67, 842, 1114, 939, 0, 2305, 1444, 1192, 2219, 0, 2868, 788, 404, 2740, 1444, 593, 2130, 2117, 2946, 0, 2885, 2820, 2864, 2897, 2834, 693, 2949, 2117, 37, 2309, 2373, 2866, 0, 0, 0, 2115, 834, 581, 602, 0, 2629, 586, 66, 0, 0, 898, 644, 586, 2629, 400, 1444, 1186, 1057, 1049, 0, 1080, 1332, 309, 0, 0, 81, 69, 0, 0, 0, 2309, 1283, 1336, 1412, 0, 2373, 0, 0, 0, 0, 1207, 2484, 2745, 0, 0, 776, 1207, 2484, 2745, 0, 320, 2881, 2932, 2737, 0, 1050, 1073, 1155, 1195, 1207, 329, 577, 1858, 2930, 0, 657, 1170, 2882, 1867, 131, 1867, 2882, 576, 0, 0, 1207, 692, 804, 2100, 0, 666, 1938, 1175, 882, 0, 1954, 1946, 1865, 1824, 1800, 1866, 1034, 26, 890, 570, 1864, 538, 0, 0, 0, 2324, 1047, 1811, 0, 0, 1800, 263, 2327, 1175, 0, 880, 1856, 0, 0, 0, 1864, 0, 0, 0, 0, 2697, 2954, 0, 0, 0, 179, 2480, 2745, 0, 0, 416, 168, 2219, 0, 0, 939, 794, 0, 0, 0, 657, 2962, 2203, 0, 0, 297, 2347, 2483, 2352, 0, 40, 696, 0, 0, 0, 811, 0, 0, 0, 0, 898, 650, 2697, 0, 0, 2336, 2466, 0, 0, 0, 2083, 2600, 424, 24, 0, 2593, 0, 0, 0, 0, 2067, 2193, 0, 0, 0, 265, 0, 0, 0, 0, 2051, 0, 0, 0, 0, 0, 0, 0, 0, 0);
fn decode_triangle(packed: u32) -> vec3<u32> {
    let edge0 = (packed >> 0u) & 0xFu;
    let edge1 = (packed >> 4u) & 0xFu;
    let edge2 = (packed >> 8u) & 0xFu;
    return vec3<u32>(edge0, edge1, edge2);
}

fn get_case_triangle(case_idx: u32, tri_idx: u32) -> u32 {
    let offset = case_idx * 5u + tri_idx;
    return CASES[offset];
}

fn get_field_value(wx: u32, wy: u32, wz: u32) -> f32 {
    let idx = wx + wy * params.width + wz * params.width * params.height;
    return fieldData[idx];
}
fn get_field_value_interpolated(pos: vec3<f32>) -> f32 {
    let x0 = u32(floor(pos.x));
    let y0 = u32(floor(pos.y));
    let z0 = u32(floor(pos.z));
    let x1 = min(x0 + 1u, params.width - 1u);
    let y1 = min(y0 + 1u, params.height - 1u);
    let z1 = min(z0 + 1u, params.depth - 1u);
    
    let fx = fract(pos.x);
    let fy = fract(pos.y);
    let fz = fract(pos.z);
    
    // Sample 8 corners of the cube
    let v000 = get_field_value(x0, y0, z0);
    let v100 = get_field_value(x1, y0, z0);
    let v010 = get_field_value(x0, y1, z0);
    let v110 = get_field_value(x1, y1, z0);
    let v001 = get_field_value(x0, y0, z1);
    let v101 = get_field_value(x1, y0, z1);
    let v011 = get_field_value(x0, y1, z1);
    let v111 = get_field_value(x1, y1, z1);
    
    // Trilinear interpolation
    let v00 = mix(v000, v100, fx);
    let v01 = mix(v001, v101, fx);
    let v10 = mix(v010, v110, fx);
    let v11 = mix(v011, v111, fx);
    
    let v0 = mix(v00, v10, fy);
    let v1 = mix(v01, v11, fy);
    
    return mix(v0, v1, fz);
}

// --- Compute normal by central differences ---
fn get_normal(pos: vec3<f32>) -> vec3<f32> {
    let d = 1.0;
    let px = clamp(pos.x, 1.0, f32(params.width - 2u));
    let py = clamp(pos.y, 1.0, f32(params.height - 2u));
    let pz = clamp(pos.z, 1.0, f32(params.depth - 2u));
    let fxp = get_field_value_interpolated(vec3<f32>(px + d, py, pz));
    let fxm = get_field_value_interpolated(vec3<f32>(px - d, py, pz));
    let fyp = get_field_value_interpolated(vec3<f32>(px, py + d, pz));
    let fym = get_field_value_interpolated(vec3<f32>(px, py - d, pz));
    let fzp = get_field_value_interpolated(vec3<f32>(px, py, pz + d));
    let fzm = get_field_value_interpolated(vec3<f32>(px, py, pz - d));
    let n = vec3<f32>(fxp - fxm, fyp - fym, fzp - fzm);
    return normalize(- n);
}

// --- Terrain type heuristic: 0=grass, 2=rock, 3=snow, 4=water, 5=sand ---
fn get_terrain_type(pos: vec3<f32>, normal: vec3<f32>) -> u32 {
    let WATER_LEVEL = 30.0;
    let SNOW_LINE = 140.0;
    let y = pos.y;
    let upDot = clamp(normal.y, - 1.0, 1.0);
    let slope = 1.0 - abs(upDot);

    if (y < WATER_LEVEL + 3.0 && slope < 0.45) {
        return 5u;
        // sand
    }
    if (y > SNOW_LINE) {
        return 3u;
        // snow
    }
    if (slope > 0.8 || upDot < 0.4) {
        return 2u;
        // rock
    }
    return 0u;
    // grass
}

fn interpolate_edge(cube_pos: vec3<f32>, edge_idx: u32, values: array<f32, 8>) -> vec3<f32> {
    let edge = EDGES[edge_idx];
    let v0 = VERTICES[edge.x];
    let v1 = VERTICES[edge.y];
    let val0 = values[edge.x];
    let val1 = values[edge.y];
    let t = (0.5 - val0) / (val1 - val0);
    let t_clamped = clamp(t, 0.0, 1.0);
    let p0 = cube_pos + v0;
    let p1 = cube_pos + v1;
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

    let voxel_idx = x + y * (params.width - 1u) + z * (params.width - 1u) * (params.height - 1u);
    let base_vertex = vertexOffsets[voxel_idx];

    var written: u32 = 0u;
    for (var tri_idx: u32 = 0u; tri_idx < 5u; tri_idx = tri_idx + 1u) {
        let packed_tri = get_case_triangle(cube_mask, tri_idx);
        if (packed_tri == 0u) {
            break;
        }

        let edges = decode_triangle(packed_tri);
        let v0 = interpolate_edge(cube_pos, edges.x, cube_values);
        let v1 = interpolate_edge(cube_pos, edges.y, cube_values);
        let v2 = interpolate_edge(cube_pos, edges.z, cube_values);

        let n0 = get_normal(v0);
        let n1 = get_normal(v1);
        let n2 = get_normal(v2);

        let t0 = get_terrain_type(v0, n0);
        let t1 = t0;
        let t2 = t0;

        let vtx_idx = base_vertex + written;
        
        // Interleaved layout: position.xyz, normal.xyz, terrain_type, padding
        // Index 0: position
        interleavedData[vtx_idx * 2u] = vec4<f32>(v0, bitcast<f32>(t0));
        interleavedData[vtx_idx * 2u + 1u] = vec4<f32>(n0, 0.0);
        
        interleavedData[(vtx_idx + 1u) * 2u] = vec4<f32>(v2, bitcast<f32>(t2));
        interleavedData[(vtx_idx + 1u) * 2u + 1u] = vec4<f32>(n2, 0.0);
        
        interleavedData[(vtx_idx + 2u) * 2u] = vec4<f32>(v1, bitcast<f32>(t1));
        interleavedData[(vtx_idx + 2u) * 2u + 1u] = vec4<f32>(n1, 0.0);

        indexData[vtx_idx] = vtx_idx;
        indexData[vtx_idx + 1u] = vtx_idx + 1u;
        indexData[vtx_idx + 2u] = vtx_idx + 2u;

        written = written + 3u;
    }
}