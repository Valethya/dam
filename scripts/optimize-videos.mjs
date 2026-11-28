import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import ffmpegPath from 'ffmpeg-static';

if (!ffmpegPath) throw new Error('ffmpeg-static no entregó un binario compatible.');

const jobs = [
  ['public/videos/DRONLOGT1.mov', 'public/videos/DRONLOGT1-web.mp4', '1620:1080', '1900k'],
  ['public/videos/barberhaus.mp4', 'public/videos/barberhaus-web.mp4', '1620:1080', '2220k'],
  ['public/videos/matrimonioam.mov', 'public/videos/matrimonioam-web.mp4', '1620:1080', '2530k'],
  ['public/videos/matrimoniopm.mov', 'public/videos/matrimoniopm-web.mp4', '1080:720', '3020k'],
  ['public/videos/nikkei.mov', 'public/videos/nikkei-web.mp4', '1280:720', '1960k'],
  ['public/videos/ornamental.mov', 'public/videos/ornamental-web.mp4', '1920:1080', '2240k'],
  ['public/videos/petra.mov', 'public/videos/petra-web.mp4', '1920:1080', '2235k'],
  ['public/videos/pulpo.mp4', 'public/videos/pulpo-web.mp4', '1280:720', '2605k'],
];

const runFfmpeg = (args, label) => {
  const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`ffmpeg falló para ${label}`);
};

for (const [inputRel, outputRel, scale, bitrate] of jobs) {
  const input = resolve(inputRel);
  const output = resolve(outputRel);

  if (!existsSync(input)) throw new Error(`Video de origen inexistente: ${inputRel}`);
  rmSync(output, { force: true });

  console.log(`[video] optimizando ${inputRel}`);
  runFfmpeg([
    '-y',
    '-i', input,
    '-map', '0:v:0',
    '-vf', `scale=${scale}:flags=lanczos`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-b:v', bitrate,
    '-maxrate', bitrate,
    '-bufsize', `${Math.round(Number.parseInt(bitrate, 10) * 2)}k`,
    '-pix_fmt', 'yuv420p',
    '-an',
    '-movflags', '+faststart',
    output,
  ], inputRel);

  rmSync(input, { force: true });
  console.log(`[video] listo ${outputRel} ${(statSync(output).size / 1024 / 1024).toFixed(2)} MB`);
}

// Find the first frame with meaningful visible content, including after a fade.
for (const [, outputRel] of jobs) {
  const video = resolve(outputRel);
  const poster = resolve(outputRel.replace(/-web\.mp4$/, '-first-frame.webp'));
  const result = spawnSync(ffmpegPath, [
    '-v', 'info', '-i', video, '-an',
    '-vf', "scale=160:-2,blackframe=amount=0:threshold=40,metadata=mode=select:key=lavfi.blackframe.pblack:value=85:function=less,showinfo",
    '-frames:v', '1', '-f', 'null', '-',
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('Poster scan failed: ' + outputRel);
  const match = result.stderr.match(/pts_time:([0-9.]+)/);
  const time = match ? Number(match[1]) : 0;
  runFfmpeg([
    '-y', '-i', video, '-ss', String(time), '-map', '0:v:0',
    '-frames:v', '1', '-c:v', 'libwebp', '-lossless', '1', poster,
  ], poster);
  console.log(`[video] poster listo ${poster} @ ${time}s`);
}
