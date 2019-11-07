precision highp float;
varying vec2 uv;

uniform sampler2D Texture;


void main()
{
	float Luma = texture(Texture, uv).x;
	gl_FragColor = float4( Luma, Luma, Luma, 1 );
}


