const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const dir = path.join(__dirname, 'public', 'qa_captures');
const files = [
  '01_dashboard.png',
  '02_student_modal_open.png',
  '03_student_created.png',
  '04_student_detail.png',
  '05_exploration_view.png',
  '06_planner_view.png',
  '07_admin_view.png',
  '08_settings_view.png'
].filter(f => fs.existsSync(path.join(dir, f)));

if (files.length === 0) {
  console.error('No frames found');
  process.exit(1);
}

const listPath = path.join(dir, 'frames.txt');
let txt = '';
for (const f of files) {
  txt += `file '${path.join(dir, f).replace(/\\/g, '/')}'\n`;
  txt += `duration 2.2\n`;
}
// last frame repeat (concat demuxer rule)
txt += `file '${path.join(dir, files[files.length - 1]).replace(/\\/g, '/')}'\n`;
fs.writeFileSync(listPath, txt, 'utf8');

const out = path.join(dir, 'instagram_story_1080x1920.mp4');

const args = [
  '-y',
  '-f', 'concat',
  '-safe', '0',
  '-i', listPath,
  '-vf',
  "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
  '-r', '30',
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  out
];

const res = spawnSync(ffmpegPath, args, { stdio: 'pipe', encoding: 'utf8' });
if (res.status !== 0) {
  console.error(res.stderr || res.stdout || 'ffmpeg failed');
  process.exit(res.status || 1);
}

console.log(JSON.stringify({ output: out, frames: files.length }, null, 2));
