#version 300 es

uniform mat4 u_Model;       // Transformations of object
uniform mat4 u_ModelInvTr;  // Inverse transpose of the model matrix
uniform mat4 u_ViewProj;    // Camera transformation

in vec4 vs_Pos;             // vertex positions
in vec4 vs_Nor;             // vertex normals
in vec4 vs_Col;             // vertex colors

uniform float u_IsInstance;

in vec4 vs_Translation;
in vec4 vs_Quaternion;
in vec3 vs_Scale;

out vec4 fs_Nor;            
out vec4 fs_LightVec;       
out vec4 fs_Col;           

const vec4 lightPos = vec4(500, 500, -300, 1); // light position

void main()
{
    fs_Col = vs_Col;

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0); // ensure the normals remain perpendicular to the surface

    vec4 tempPos = u_Model * vs_Pos; 

    if (u_IsInstance == 1.f) {
      tempPos = vec4(tempPos[0] * vs_Scale[0], tempPos[1] * vs_Scale[1], tempPos[2] * vs_Scale[2], 1.f);

      vec3 v = vec3(tempPos);
      vec3 u = vec3(vs_Quaternion);
      float s = vs_Quaternion[3];
      vec3 newPos = 2.0f * dot(u, v) * u + (s * s - dot(u, u)) * v + 2.0f * s * cross(u, v);

      newPos += vec3(vs_Translation);
      tempPos = vec4(newPos, 1.f);
    }

    fs_LightVec = lightPos - tempPos;  // direction light source
    gl_Position = u_ViewProj * tempPos;
}