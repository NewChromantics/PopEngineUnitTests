Video Test
============================

This project decodes an mp4 into a video, and loops. Nothing too fancy.

Currently leaking memory somewhere.

PopEngine/PopH264 uses a version of Broadway which only supports `Baseline 3.0`, so you may need to reencode video;
`ffmpeg -i ToyStory4.mp4 -profile:v baseline -level 3.0 -c:a copy ToyStory4_Baseline3.mp4`

