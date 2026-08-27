import { spawnSync } from 'node:child_process';
import { existsSync, renameSync, rmSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import ffmpegPath from 'ffmpeg-static';

if (!ffmpegPath) throw new Error('ffmpeg-static no entregó un binario compatible.');

const jobs = [
  ['public/videos/DRONLOGT1.mov', '1620:1080', '1900k'],
  ['public/videos/barberhaus.mp4', '1620:1080', '2220k'],
  ['public/videos/matrimonioam.mov', '1620:1080', '2530k'],
  ['public/videos/matrimoniopm.mov', '1080:720', '3020k'],
  ['public/videos/nikkei.mov', '1280:720', '1960k'],
  ['public/videos/ornamental.mov', '1920:1080', '2240k'],
  ['public/videos/petra.mov', '1920:1080', '2235k'],
  ['public/videos/pulpo.mp4', '1280:720', '2605k'],
];

for (const [inputRel, scale, bitrate] of jobs) {
  const input = resolve(inputRel);
  if (!existsSync(input)) throw new Error(`Video de origen inexistente: ${inputRel}`);

  const extension = extname(input);
  const temp = `${input.slice(0, -extension.length)}.web-preview${extension}`;
  rmSync(temp, { force: true });

  console.log(`[video] optimizando ${inputRel}`);
  const result = spawnSync(ffmpegPath, [
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
    temp,
  ], { stdio: 'inherit' });

  if (result.status !== 0) {
    rmSync(temp, { force: true });
    throw new Error(`ffmpeg falló para ${inputRel}`);
  }

  renameSync(temp, input);
  console.log(`[video] listo ${(statSync(input).size / 1024 / 1024).toFixed(2)} MB`);
}
