const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const puppeteer = require('puppeteer');

const API='http://127.0.0.1:8090';
const WEB='http://127.0.0.1:4173/';
const EMAIL='chrisklee69@gmail.com';
const PASSWORD='aussie1996@@@';
const out='C:/Users/chris/Desktop/suprima_교과세특/consultant_app/public/captures_16x9_realflow/09_license_expired_16x9.png';

async function auth(){
  const r=await fetch(`${API}/api/admins/auth-with-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity:EMAIL,password:PASSWORD})});
  if(!r.ok) throw new Error('auth failed');
  return r.json();
}

async function api(token, method, url, body){
  const r=await fetch(`${API}${url}`,{method,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body: body?JSON.stringify(body):undefined});
  if(!r.ok){ throw new Error(await r.text()); }
  return r.json();
}

(async()=>{
  const a=await auth();
  const token=a.token;
  const list=await api(token,'GET','/api/collections/licenses/records?perPage=50',null);
  const target=list.items && list.items.length? list.items[0]: await api(token,'POST','/api/collections/licenses/records',{academy_id:'suprema_main',active:true,is_active:true});

  // disable
  await api(token,'PATCH',`/api/collections/licenses/records/${target.id}`,{active:false,is_active:false});

  const browser=await chromium.launch({headless:true, executablePath: puppeteer.executablePath(), args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const context=await browser.newContext({viewport:{width:1920,height:1080}});
  const page=await context.newPage();
  const authObj={token:a.token, model:a.admin};
  await page.goto(WEB,{waitUntil:'domcontentloaded'});
  await page.evaluate((x)=>localStorage.setItem('pocketbase_auth', JSON.stringify(x)), authObj);
  await page.reload({waitUntil:'networkidle'});
  await new Promise(r=>setTimeout(r,1200));
  await page.screenshot({path:out});
  await context.close(); await browser.close();

  // restore
  await api(token,'PATCH',`/api/collections/licenses/records/${target.id}`,{active:true,is_active:true});

  console.log(JSON.stringify({saved:out, restored:true},null,2));
})();
