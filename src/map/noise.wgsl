/**
  * vibecoded slope noise wgsl implementation
  * TODO: add customizable parameters 
   TODO: rework settings ui
  */



@group(0) @binding(0)
var<storage, read_write> field: array<f32>;

@group(0) @binding(1)
var<uniform> params: Params;

//TODO: sync with WebGPU compute.ts
struct Params {
    seed: u32,
    width: u32,
    height: u32,
    depth: u32,
    baseX: u32,
    baseY: u32,
    baseZ: u32,
    _pad: u32, // padding for 16-byte alignment
    // Noise / terrain configurable parameters (packed to 16-byte aligned region)
    frequency: f32,
    heightScale: f32,
    waterLevel: f32,
    islandAmount: f32,
    octaves: u32,
    persistence: f32,
    lacunarity: f32,
    caveThreshold: f32,
};

// ---------------- Constants ----------------
const F3: f32 = 1.0 / 3.0;
const G3: f32 = 1.0 / 6.0;

// ---------------- Hash & Gradients ----------------
fn hash(u: u32) -> u32 {
    var a = u;
    a = (a ^ 61u) ^ (a >> 16u);
    a = a + (a << 3u);
    a = a ^ (a >> 4u);
    a = a * 0x27d4eb2du;
    a = a ^ (a >> 15u);
    return a;
}

fn grad3D(h: u32, x: f32, y: f32, z: f32) -> f32 {
    let hmod = h & 15u;
    let u = select(y, x, hmod < 8u);
    let v = select(select(z, y, hmod < 4u), select(y, x, hmod < 4u), (hmod & 12u) == 0u);
    let a = select(-u, u, (hmod & 1u) == 0u);
    let b = select(-v, v, (hmod & 2u) == 0u);
    return a + b;
}

// ---------------- Simplex Noise ----------------
fn simplexNoise3D(x: f32, y: f32, z: f32, seed: u32) -> f32 {
    let s = (x + y + z) * F3;
    let i = floor(x + s);
    let j = floor(y + s);
    let k = floor(z + s);

    let t = (i + j + k) * G3;
    let X0 = i - t;
    let Y0 = j - t;
    let Z0 = k - t;

    let x0 = x - X0;
    let y0 = y - Y0;
    let z0 = z - Z0;

    var i1: u32; var j1: u32; var k1: u32;
    var i2: u32; var j2: u32; var k2: u32;

    if (x0 >= y0) {
        if (y0 >= z0) { i1=1u; j1=0u; k1=0u; i2=1u; j2=1u; k2=0u; }
        else if (x0 >= z0) { i1=1u; j1=0u; k1=0u; i2=1u; j2=0u; k2=1u; }
        else { i1=0u; j1=0u; k1=1u; i2=1u; j2=0u; k2=1u; }
    } else {
        if (y0 < z0) { i1=0u; j1=0u; k1=1u; i2=0u; j2=1u; k2=1u; }
        else if (x0 < z0) { i1=0u; j1=1u; k1=0u; i2=0u; j2=1u; k2=1u; }
        else { i1=0u; j1=1u; k1=0u; i2=1u; j2=1u; k2=0u; }
    }

    let x1 = x0 - f32(i1) + G3;
    let y1 = y0 - f32(j1) + G3;
    let z1 = z0 - f32(k1) + G3;
    let x2 = x0 - f32(i2) + 2.0*G3;
    let y2 = y0 - f32(j2) + 2.0*G3;
    let z2 = z0 - f32(k2) + 2.0*G3;
    let x3 = x0 - 1.0 + 3.0*G3;
    let y3 = y0 - 1.0 + 3.0*G3;
    let z3 = z0 - 1.0 + 3.0*G3;

    let ii = u32(i) & 255u;
    let jj = u32(j) & 255u;
    let kk = u32(k) & 255u;

    let gi0 = hash(ii + hash(jj + hash(kk + seed))) & 15u;
    let gi1 = hash(ii + i1 + hash(jj + j1 + hash(kk + k1 + seed))) & 15u;
    let gi2 = hash(ii + i2 + hash(jj + j2 + hash(kk + k2 + seed))) & 15u;
    let gi3 = hash(ii + 1u + hash(jj + 1u + hash(kk + 1u + seed))) & 15u;

    var n0: f32 = 0.0;
    var n1: f32 = 0.0;
    var n2: f32 = 0.0;
    var n3: f32 = 0.0;

    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0>0.0) { n0 = pow(t0,4.0)*grad3D(gi0,x0,y0,z0); }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1>0.0) { n1 = pow(t1,4.0)*grad3D(gi1,x1,y1,z1); }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2>0.0) { n2 = pow(t2,4.0)*grad3D(gi2,x2,y2,z2); }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3>0.0) { n3 = pow(t3,4.0)*grad3D(gi3,x3,y3,z3); }

    return 32.0*(n0+n1+n2+n3);
}

// ---------------- Fractal Noise ----------------
fn fractalNoise3D(x:f32, y:f32, z:f32, seed:u32, octaves:u32, persistence:f32, lacunarity:f32) -> f32 {
    var total: f32 = 0.0;
    var amplitude: f32 = 1.0;
    var frequency: f32 = 1.0;
    var maxVal: f32 = 0.0;

    for(var i: u32 = 0u; i < octaves; i=i+1u) {
        total += simplexNoise3D(x*frequency, y*frequency, z*frequency, seed+i) * amplitude;
        maxVal += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return total / maxVal;
}

// ---------------- Terrain Height ----------------
fn terrainHeight(x:f32, z:f32, seed:u32) -> f32 {
    // Use configurable frequency and height scale from params
    let freq = params.frequency;
    let scale = params.heightScale;
    let octs = params.octaves;
    let pers = params.persistence;
    let lac = params.lacunarity;
    return 20.0 + fractalNoise3D(x*freq, 0.0, z*freq, seed, octs, pers, lac) * scale;
}

// ---------------- Density Function ----------------
fn densityAt(x:f32, y:f32, z:f32, seed:u32) -> f32 {
    let globalX = x + f32(params.baseX);
    let globalY = y + f32(params.baseY);
    let globalZ = z + f32(params.baseZ);

    // World scaling
    let baseFreq = params.frequency;
    let octs = params.octaves;
    let pers = params.persistence;
    let lac  = params.lacunarity;
    if(globalY < params.waterLevel) {
        return 1.0;
    }
    // Large-scale height field (continuous, noise-only)
    let m = fractalNoise3D(globalX*baseFreq*0.25, 0.0, globalZ*baseFreq*0.25, seed + 11u, octs, pers, lac);
    // Convert [-1..1] approx -> [0..1]
    let macro01 = m * 0.5 + 0.5;

    // Mountains: bias + sharpen peaks
    let mountains = pow(macro01, 2.2);

    // Target ground height from noise only (no branching)
    let ground = params.heightScale * mountains + 8.0;

    // Base density: positive below ground, negative above
    let base = ground - globalY;

    // Add mid/high frequency terrain detail
    let detail = fractalNoise3D(globalX*baseFreq, globalY*baseFreq*0.35, globalZ*baseFreq, seed + 37u, octs, pers, lac);
    let detailAmp = params.heightScale * 0.15;

    // Caves (continuous mask)
    let caveNoise = fractalNoise3D(globalX*baseFreq*2.0, globalY*baseFreq*2.0, globalZ*baseFreq*2.0, seed + 97u, octs, pers, lac);
    let cave = (caveNoise - params.caveThreshold) * 8.0;

    return base + detail * detailAmp - cave;
}

// ---------------- Compute Entry ----------------
@compute @workgroup_size(4,4,4)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    let z = global_id.z;

    if (x >= params.width || y >= params.height || z >= params.depth) { return; }

    let value = densityAt(f32(x), f32(y), f32(z), params.seed);

    let index = z*params.width*params.height + y*params.width + x;
    field[index] = value;
}
