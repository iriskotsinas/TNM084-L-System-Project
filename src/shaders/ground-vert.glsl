#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 fs_Nor;


float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm (in vec2 st) {
    // Initial values
    st/=10.f;
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value*10.f;
}

// float displace(vec3 point) {
//     return fbm(vs_Pos.xz);
// }

// vec3 orthogonal(vec4 v) {
// 	return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
//     : vec3(0.0, -v.z, v.y));
// }

// the function which defines the displacement
float displace(vec3 point) {
    return fbm(point.xy);
}

vec3 orthogonal(vec3 v) {
	return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
    : vec3(0.0, -v.z, v.y));
}

void main()
{

    vec3 displacedPosition = vec3(position.x, position.y, displace(position));

    float offset = size / resolution;
	vec3 tangent = orthogonal(normal);
    vec3 bitangent = normalize(cross(normal, tangent));
    vec3 neighbour1 = position + tangent * offset;
    vec3 neighbour2 = position + bitangent * offset;
    vec3 displacedNeighbour1 = vec3(neighbour1.xy, displace(neighbour1));
    vec3 displacedNeighbour2 = vec3(neighbour2.xy, displace(neighbour2));
          
    // https://i.ya-webdesign.com/images/vector-normals-tangent-16.png
    vec3 displacedTangent = displacedNeighbour1 - displacedPosition;
    vec3 displacedBitangent = displacedNeighbour2 - displacedPosition;
          
    // https://upload.wikimedia.org/wikipedia/commons/d/d2/Right_hand_rule_cross_product.svg
    vec3 displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
    // vec3 displacedPosition = vec3(vs_Pos.x, vs_Pos.y, displace(vec3(vs_Pos.x, vs_Pos.y, vs_Pos.z)));

    // //float offset = size / resolution;
	// vec3 tangent = orthogonal(vs_Nor);
    // vec3 bitangent = normalize(cross(vec3(vs_Nor.x, vs_Nor.y, vs_Nor.z), tangent));
    // vec3 neighbour1 = vec3(vs_Nor.x, vs_Nor.y, vs_Nor.z) + tangent;
    // vec3 neighbour2 = vec3(vs_Nor.x, vs_Nor.y, vs_Nor.z) + bitangent;
    // vec3 displacedNeighbour1 = vec3(neighbour1.xy, displace(neighbour1));
    // vec3 displacedNeighbour2 = vec3(neighbour2.xy, displace(neighbour2));
          
    // // https://i.ya-webdesign.com/images/vector-normals-tangent-16.png
    // vec3 displacedTangent = displacedNeighbour1 - displacedPosition;
    // vec3 displacedBitangent = displacedNeighbour2 - displacedPosition;
          
    // // https://upload.wikimedia.org/wikipedia/commons/d/d2/Right_hand_rule_cross_product.svg
    // vec3 displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
    // fs_Nor = vec4(displacedNormal.x, displacedNormal.y, displacedNormal.z, 1.f);
    // // fs_Nor = vec4(normalize(nor), 1.f);
    // fs_Pos = vec4(displacedPosition.x, displacedPosition.y, displacedPosition.z, 1.f);
    // gl_Position = u_ViewProj *  fs_Pos;

    // float tc = fbm(vs_Pos.xz);
    // float tx = fbm(vec2(vs_Pos.x + .1f, vs_Pos.z));
    // float tz = fbm(vec2(vs_Pos.x, vs_Pos.z + .1f));

    // vec3 nor = -cross(vec3(.1f, tx-tc, 0.f), vec3(0.f, tz-tc, .1f));

    // fs_Pos = vec4(vs_Pos.x, tc, vs_Pos.z, 1.f);

    // fs_Nor = vec4(normalize(nor), 1.f);

    // //gl_Position = u_ViewProj *  vs_Pos;
    // gl_Position = u_ViewProj *  fs_Pos * 0.5;
}