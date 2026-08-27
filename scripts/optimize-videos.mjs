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

const heroPoster = resolve('public/videos/DRONLOGT1_poster.webp');
rmSync(heroPoster, { force: true });
runFfmpeg([
  '-y',
  '-ss', '1',
  '-i', resolve('public/videos/DRONLOGT1-web.mp4'),
  '-frames:v', '1',
  '-vf', 'scale=1280:-2:flags=lanczos',
  '-c:v', 'libwebp',
  '-q:v', '76',
  heroPoster,
], 'poster del hero');

console.log(`[video] poster hero listo ${(statSync(heroPoster).size / 1024).toFixed(0)} KB`);
