#version 300 es

precision highp float;

uniform vec4 u_Color;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col;

void main()
{
    vec4 diffCol = fs_Col;

    // Diffuse term for Lambert shading
    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));

    // Avoid negative light
    diffuseTerm = abs(diffuseTerm);
    diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

    float ambientTerm = 0.55;
    float lightIntensity = diffuseTerm + ambientTerm;
    float len = length(fs_Pos);

    vec4 col = vec4(diffCol.rgb * lightIntensity, diffCol.a);
    if (fs_Pos.x > .8f) {
        col = vec4(vec3(0.9f, 0.9f, 0.9f) * diffuseTerm * 1.2f, 1.f);
    }
    out_Col = col;
}