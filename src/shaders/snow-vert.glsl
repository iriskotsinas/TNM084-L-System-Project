#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes; // For rendering of particles as billboards

in vec4 vs_Pos;
in vec3 vs_SnowPos;

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 fs_Nor;

void main()
{
    fs_Pos = vs_Pos;
    vec3 pos = vs_SnowPos.xyz;

    // Movement of the snowflake
    pos.y -= u_Time / 50.f;
    pos.y = mod(pos.y, 150.f);

    vec3 billboardPos =  pos + vs_Pos.x * u_CameraAxes[0] + vs_Pos.z * u_CameraAxes[1];
    gl_Position = u_ViewProj * vec4(billboardPos, 1.f);
}