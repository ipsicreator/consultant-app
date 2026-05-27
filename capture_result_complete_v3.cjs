const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');
const ffmpegPath = require('ffmpeg-static');

const BASE_URL = 'http://127.0.0.1:5175';
const outDir = path.join(process.cwd(), 'public', 'qa_captures');
const framesDir = path.join(outDir, 'frames_result_v3');
const shotsDir = path.join(outDir, 'shots_v3');
const outputVideo = path.join(outDir, 'full_flow_1920x1080.mp4');

fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(shotsDir, { recursive: true });
for (const f of fs.readdirSync(framesDir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(framesDir, f));
for (const f of fs.readdirSync(shotsDir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(shotsDir, f));
let frame=1; const pad=n=>String(n).padStart(4,'0'); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snap=async(page,name,hold=8)=>{await page.screenshot({path:path.join(shotsDir,`${name}.png`)}); for(let i=0;i<hold;i++) await page.screenshot({path:path.join(framesDir,`frame_${pad(frame++)}.png`)})};

(async()=>{
 const b=await puppeteer.launch({headless:true,defaultViewport:{width:1920,height:1080}});
 const p=await b.newPage();
 await p.goto(BASE_URL,{waitUntil:'networkidle2'});
 await sleep(1200);
 await snap(p,'00_dashboard');

 await p.$$eval('li',(els)=>{const t=els.find(e=>(e.textContent||'').includes('학생별 AI 분석')); if(t)t.click();});
 await sleep(900);
 await snap(p,'01_student_page');

 await p.click('textarea');
 await p.keyboard.type('수학 심화탐구 활동, 과학 프로젝트 발표, 팀 협업 우수',{delay:18});
 await p.$$eval('button',(els)=>{const t=els.find(e=>(e.textContent||'').includes('분석 실행')); if(t)t.click();});
 await sleep(1200);
 await snap(p,'02_result_filled',10);

 await p.$$eval('button',(els)=>{const t=els.find(e=>(e.textContent||'').includes('저장')); if(t)t.click();});
 await sleep(900);
 await snap(p,'03_saved_history',8);

 await b.close();
 execFileSync(ffmpegPath,['-y','-framerate','2','-i',path.join(framesDir,'frame_%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-r','30',outputVideo],{stdio:'inherit'});
 console.log('VIDEO_DONE:'+outputVideo);
})();
