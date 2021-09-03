# Fork of Kagami/video-tools

I have an idea for a video drop tool. This package (cmpv.py) will help identifying the right target video by calculating the [SSIM (Structural SImilarity Metric)](https://en.wikipedia.org/wiki/Structural_similarity) between two input videos using [FFmpeg's ssim filter](https://ffmpeg.org/ffmpeg-filters.html#ssim).

For this to work I added a lot of console output and calculate the file with the highest SSIM dB value.

Results are also saved as JSON file.

I also fixed a bug that would make cmpv.py break if two identical videos are compared.

Kudos and thanks to [Kagami](https://github.com/Kagami)! This is really helpful and provided me with the perfect excuse to play with Python again.

### NOTE:

**Python v3.4+ is now required.**
(because of the pathlib module I wanted to use).

### Example output:

```bash
python3 cmpv.py -k -o ./graphs/v2-new.png -ref videos/v2-new.mp4 -r pal videos/v1-old.mp4 videos/v2-old.mp4 videos/v3-old.mp4 videos/v4-old.mp4;
```

![terminal-output](/_assets/terminal-output.png)
and the JSON file:

```json
{
	"refpath": "videos/v2-new.mp4",
	"inpaths": [
		{ "file": "videos/v1-old.mp4", "ssim": 8.152 },
		{ "file": "videos/v2-old.mp4", "ssim": 33.962 },
		{ "file": "videos/v3-old.mp4", "ssim": 8.551 },
		{ "file": "videos/v4-old.mp4", "ssim": 9.263 }
	],
	"bestMatch": { "file": "videos/v2-old.mp4", "ssim": 33.962 }
}
```

## [cmpv.py](cmpv.py)

Compare videos frame by frame and draw nice SSIM distribution graph.

![](https://raw.githubusercontent.com/Kagami/video-tools/assets/graph.png)

#### Requirements

-   [Python](https://www.python.org/downloads/) 2.7+ or 3.2+
-   [FFmpeg](https://ffmpeg.org/download.html) 2+
-   [matplotlib](http://matplotlib.org/)

#### Usage

```bash
# Compare two videos using SSIM
python cmpv.py -ref orig.mkv 1.mkv 2.mkv
# Fix ref resolution
python cmpv.py -ref orig.mkv -refvf scale=640:-1 1.mkv
# Show time on x axis
python cmpv.py -ref orig.mkv -r ntsc-film 1.mkv 2.mkv
```

## [fps.ipynb](fps.ipynb)

Example IPython notebook for drawing real fps (unique frames only) distribution graph across media file.

![](https://raw.githubusercontent.com/Kagami/video-tools/assets/fps.png)

## [y2aa](y2aa)

Make ASCII-art version of provided image data.

![](https://raw.githubusercontent.com/Kagami/video-tools/assets/y2aa.png)

#### Requirements

-   [Rust](https://www.rust-lang.org/) 1+
-   [FreeType](http://freetype.org/) 2+
-   [aalib](http://aa-project.sourceforge.net/aalib/)

#### Usage

```bash
ffmpeg -i in.mkv -f rawvideo -pix_fmt gray - |\
  y2aa -w 1280 -h 720 - |\
  ffmpeg -f rawvideo -pixel_format gray -video_size 1280x720 -i - out.mkv
```

## See also

-   [webm.py wiki](https://github.com/Kagami/webm.py/wiki), contains few helper scripts
-   [webm-thread tools](https://github.com/pituz/webm-thread/tree/master/tools)

## License

video-tools - Various video tools

Written in 2015 by Kagami Hiiragi <kagami@genshiken.org>

To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.

You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
