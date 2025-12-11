@group(0) @binding(0)
var<storage, read_write> field: array<f32>;

@group(0) @binding(1)
var<uniform> params: Params;
@group(0) @binding(2)
var<storage, read> permTable: array<u32, 256>;
struct Params {
    seed: u32,
    width: u32,
    height: u32,
    depth: u32,
    baseX: u32,
    baseY: u32,
    baseZ: u32,
}

fn hash(u: u32) -> u32 {
    var a = u;
    a = (a ^ 61) ^ (a >> 16);
    a = a + (a << 3);
    a = a ^ (a >> 4);
    a = a * 0x27d4eb2d;
    a = a ^ (a >> 15);
    return a;
}

fn fade(t: f32) -> f32 {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

fn lerp(t: f32, a: f32, b: f32) -> f32 {
    return a + t * (b - a);
}

fn grad(hash: u32, x: f32, y: f32) -> f32 {
    let h = hash & 15u;
    let u = select(y, x, h < 8u);
    let v = select(x, y, h < 8u);
    let a = select(- u, u, (h & 1u) == 0u);
    let b = select(- v, v, (h & 2u) == 0u);
    return a + b;
}

fn grad3D(hash: u32, x: f32, y: f32, z: f32) -> f32 {
    let h = hash & 15u;
    let u = select(y, x, h < 8u);
    let v = select(select(z, y, h < 4u), select(y, x, h < 4u), (h & 12u) == 0u);
    let a = select(- u, u, (h & 1u) == 0u);
    let b = select(- v, v, (h & 2u) == 0u);
    return a + b;
}

fn noise2D(x: f32, y: f32, seed: u32) -> f32 {
    let xi = u32(floor(x)) & 255u;
    let yi = u32(floor(y)) & 255u;

    let xf = x - floor(x);
    let yf = y - floor(y);

    let u = fade(xf);
    let v = fade(yf);

    let h00 = hash((hash(xi + seed) + yi) ^ seed);
    let h10 = hash((hash(xi + 1u + seed) + yi) ^ seed);
    let h01 = hash((hash(xi + seed) + yi + 1u) ^ seed);
    let h11 = hash((hash(xi + 1u + seed) + yi + 1u) ^ seed);

    let g00 = grad(h00, xf, yf);
    let g10 = grad(h10, xf - 1.0, yf);
    let g01 = grad(h01, xf, yf - 1.0);
    let g11 = grad(h11, xf - 1.0, yf - 1.0);

    let nx0 = lerp(u, g00, g10);
    let nx1 = lerp(u, g01, g11);
    let result = lerp(v, nx0, nx1);

    return result;
}

fn noise3D(x: f32, y: f32, z: f32, seed: u32) -> f32 {
    let xi = u32(floor(x)) & 255u;
    let yi = u32(floor(y)) & 255u;
    let zi = u32(floor(z)) & 255u;

    let xf = x - floor(x);
    let yf = y - floor(y);
    let zf = z - floor(z);

    let u = fade(xf);
    let v = fade(yf);
    let w = fade(zf);

    let h000 = hash((hash(xi + seed) + yi + zi) ^ seed);
    let h100 = hash((hash(xi + 1u + seed) + yi + zi) ^ seed);
    let h010 = hash((hash(xi + seed) + yi + 1u + zi) ^ seed);
    let h110 = hash((hash(xi + 1u + seed) + yi + 1u + zi) ^ seed);
    let h001 = hash((hash(xi + seed) + yi + zi + 1u) ^ seed);
    let h101 = hash((hash(xi + 1u + seed) + yi + zi + 1u) ^ seed);
    let h011 = hash((hash(xi + seed) + yi + 1u + zi + 1u) ^ seed);
    let h111 = hash((hash(xi + 1u + seed) + yi + 1u + zi + 1u) ^ seed);

    let g000 = grad3D(h000, xf, yf, zf);
    let g100 = grad3D(h100, xf - 1.0, yf, zf);
    let g010 = grad3D(h010, xf, yf - 1.0, zf);
    let g110 = grad3D(h110, xf - 1.0, yf - 1.0, zf);
    let g001 = grad3D(h001, xf, yf, zf - 1.0);
    let g101 = grad3D(h101, xf - 1.0, yf, zf - 1.0);
    let g011 = grad3D(h011, xf, yf - 1.0, zf - 1.0);
    let g111 = grad3D(h111, xf - 1.0, yf - 1.0, zf - 1.0);

    let nx00 = lerp(u, g000, g100);
    let nx10 = lerp(u, g010, g110);
    let nx0 = lerp(v, nx00, nx10);
    let nx01 = lerp(u, g001, g101);
    let nx11 = lerp(u, g011, g111);
    let nx1 = lerp(v, nx01, nx11);

    return lerp(w, nx0, nx1);
}

fn fractalNoise2D(x: f32, y: f32, seed: u32, octaves: u32, persistence: f32, lacunarity: f32) -> f32 {
    var total: f32 = 0.0;
    var frequency: f32 = 1.0;
    var amplitude: f32 = 1.0;
    var maxValue: f32 = 0.0;

    for (var i: u32 = 0u; i < octaves; i = i + 1u) {
        total = total + noise2D(x * frequency, y * frequency, seed + i) * amplitude;
        maxValue = maxValue + amplitude;
        amplitude = amplitude * persistence;
        frequency = frequency * lacunarity;
    }

    return total / maxValue;
}

fn fractalNoise3D(x: f32, y: f32, z: f32, seed: u32, octaves: u32, persistence: f32, lacunarity: f32) -> f32 {
    var total: f32 = 0.0;
    var frequency: f32 = 1.0;
    var amplitude: f32 = 1.0;
    var maxValue: f32 = 0.0;

    for (var i: u32 = 0u; i < octaves; i = i + 1u) {
        total = total + noise3D(x * frequency, y * frequency, z * frequency, seed + i) * amplitude;
        maxValue = maxValue + amplitude;
        amplitude = amplitude * persistence;
        frequency = frequency * lacunarity;
    }

    return total / maxValue;
}

fn terrainHeight(x: f32, z: f32, seed: u32) -> f32 {
    let height = fractalNoise2D(x * 0.01, z * 0.01, seed, 6u, 0.5, 2.0) * 100.0;
    return height;
}

fn getNoiseValue(x: f32, y: f32, z: f32, seed: u32) -> f32 {
    // Terrain height (hills)
    let terrain = terrainHeight(x, z, seed);

    // Water level
    let waterLevel: f32 = 20.0;

    // Overhangs using 3D noise
    let overhang = fractalNoise3D(x * 0.05, y * 0.05, z * 0.05, seed + 100u, 3u, 0.5, 2.0);

    // If below water level, return negative value (water)
    if (y < waterLevel) {
        return 1.0;
    }

    // Hills: solid if below terrain height
    if (y < terrain) {
        // Overhangs: carve out some air pockets
        if (overhang > 0.3) {
            return 0.0;
            // air pocket
        }
        return 1.0;
        // solid ground
    }

    // Above terrain: air
    return 0.0;
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x: u32 = global_id.x;
    let y: u32 = global_id.y;
    let z: u32 = global_id.z;
    if (x >= params.width || y >= params.height || z >= params.depth) {
        return;
    }
    let noiseValue = getNoiseValue(f32(x + params.baseX), f32(y + params.baseY), f32(z + params.baseZ), params.seed);
    let index = z * params.width * params.height + y * params.width + x;
    field[index] = noiseValue;
}