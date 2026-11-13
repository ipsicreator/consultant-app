const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
(async()=>{
 const port=await new Promise(resolve=>{const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const p=server.address().port;server.close(()=>resolve(p));});}),base='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{cwd:process.cwd(),windowsHide:true,stdio:'ignore'});let browser;
 try{
  let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,'Preview did not start');
  browser=await require('puppeteer').launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const results=[];const output=path.resolve('outputs/qa');await fs.mkdir(output,{recursive:true});
  for(const role of ['anonymous','admin','consultant','foreign-profile']){
   const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport({width:1440,height:1000});const errors=[],studentQueries=[],assignmentWrites=[];page.on('pageerror',error=>errors.push(error.message));
   let profile={id:'profile00000001',admin_id:role==='foreign-profile'?'other0000000001':'user00000000001',user:role==='foreign-profile'?'other0000000001':'user00000000001',academy_id:'academy-a',role:role==='consultant'?'consultant':'admin',name:'검증 담당자'};
   await page.setRequestInterception(true);page.on('request',request=>{const url=new URL(request.url());
    if(url.pathname==='/api/academy/activities'){
     const headers={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'};
     if(request.method()==='OPTIONS'){void request.respond({status:204,headers});return;}
     const kind=url.searchParams.get('kind')||'exploration';
     const item={id:'a'.repeat(24),kind,title:kind+' 검증 기록',content:'학생이 직접 작성한 활동입니다.',activityDate:'2026-11-14',version:2,created:'2026-11-14T00:00:00Z',updated:'2026-11-14T00:01:00Z'};
     const body=request.method()==='POST'?{linked:true,studentName:'검증 학생'}:{items:[item],page:1,totalPages:1,totalItems:1};
     void request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(body)});return;
    }
    if(url.pathname==='/api/academy/assignments'){
     const headers={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'};
     if(request.method()==='OPTIONS'){void request.respond({status:204,headers});return;}
     if(request.method()==='POST'){const payload=JSON.parse(request.postData());assignmentWrites.push(payload);void request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({id:payload.studentId,assigned_consultant:payload.consultantId,updated:'2026-11-13 00:00:01.000Z'})});return;}
     const last=assignmentWrites.at(-1);void request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({assignmentField:'assigned_consultant',maxSelect:1,students:[{id:'student00000001',name:'검증 학생',assigned_consultant:last?.consultantId||'',updated:last?'2026-11-13 00:00:01.000Z':'2026-11-13 00:00:00.000Z'}],consultants:[{id:'profile00000009',name:'배정 담당자',role:'consultant'}]})});return;}
const match=url.pathname.match(/\/api\/collections\/([^/]+)\/records(?:\/([^/]+))?/);if(match){const collection=match[1];let items=[];if(collection==='suprima_profiles')items=[profile];if(collection==='suprima_licenses')items=[{id:'license00000001',academy_id:profile.academy_id,active:true}];if(collection==='suprima_students'){studentQueries.push(url.searchParams.get('filter'));items=[{id:profile.academy_id==='academy-a'?'student00000001':'student00000002',academy_id:profile.academy_id,assigned_consultant:profile.role==='consultant'?profile.id:'',name:profile.academy_id==='academy-a'?'검증 학생':'다른 학원 학생',school:'검증고',grade:'고3',enrollment_status:'미등록'}];}void request.respond({status:200,contentType:'application/json',body:JSON.stringify(match[2]?items[0]:{page:1,perPage:500,totalItems:items.length,totalPages:1,items})});return;}if(request.url().startsWith(base)||request.url().startsWith('data:'))void request.continue();else void request.abort();});
   if(role!=='anonymous'){const token='e30.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test';await page.evaluateOnNewDocument((token)=>{const record={id:'user00000000001',collectionName:'users',email:'test@example.test'};localStorage.setItem('pocketbase_auth',JSON.stringify({token,record,model:record}));},token);}
   await page.goto(base,{waitUntil:'domcontentloaded'});
   if(role==='anonymous'){await page.waitForFunction(()=>document.body.innerText.includes('수프리마 랩 학원용 로그인'));}
   if(role==='admin'){
    await page.waitForFunction(()=>document.body.innerText.includes('검증 학생'));assert.ok(studentQueries.length>0);assert.ok(studentQueries.every(filter=>filter==='academy_id="academy-a"'));
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('NAVIGATE_TO',{detail:'admin'})));await page.waitForFunction(()=>document.body.innerText.includes('소속 실행 담당자'));assert.equal(await page.$eval('body',e=>e.innerText.includes('배정 학생 12')),false);
    await page.waitForSelector('select[aria-label="검증 학생 실행 담당자"]');
    await page.select('select[aria-label="검증 학생 실행 담당자"]','profile00000009');
    await page.click('.assignment-row button');await page.waitForFunction(()=>document.body.innerText.includes('학생 배정을 저장했습니다.'));
    assert.equal(assignmentWrites.length,1);assert.deepEqual(Object.keys(assignmentWrites[0]).sort(),['consultantId','expectedUpdated','studentId']);assert.equal(assignmentWrites[0].consultantId,'profile00000009');
    await page.screenshot({path:path.join(output,'academy-admin.png'),fullPage:true});const oldQueries=studentQueries.length;
    profile={...profile,id:'profile00000002',admin_id:'user00000000002',user:'user00000000002',academy_id:'academy-b',role:'consultant',name:'다른 담당자'};
    await page.evaluate(()=>{const auth=JSON.parse(localStorage.getItem('pocketbase_auth'));const record={id:'user00000000002',collectionName:'users',email:'other@example.test'};const value=JSON.stringify({...auth,record,model:record});localStorage.setItem('pocketbase_auth',value);window.dispatchEvent(new StorageEvent('storage',{key:'pocketbase_auth',newValue:value}));});
    await page.waitForFunction(()=>document.body.innerText.includes('다른 학원 학생'));assert.ok(studentQueries.length>oldQueries);assert.ok(studentQueries.slice(oldQueries).every(filter=>filter==='academy_id="academy-b" && assigned_consultant="profile00000002"'));assert.equal(await page.$eval('body',e=>e.innerText.includes('검증 학생')||e.innerText.includes('검증 담당자')),false);
    await page.screenshot({path:path.join(output,'academy-account-switch.png'),fullPage:true});
   }
   if(role==='consultant'){await page.waitForFunction(()=>document.body.innerText.includes('검증 학생'));assert.ok(studentQueries.length>0);assert.ok(studentQueries.every(filter=>filter==='academy_id="academy-a" && assigned_consultant="profile00000001"'));await page.click('.primary-action');await page.waitForFunction(()=>document.body.innerText.includes('학생 개인 활동 기록')&&document.body.innerText.includes('exploration 검증 기록'));
    await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='독서').click());await page.waitForFunction(()=>document.body.innerText.includes('reading 검증 기록'));
    await page.evaluate(()=>Array.from(document.querySelectorAll('summary')).find(b=>b.textContent==='개인 계정 연결 등록').click());await page.type('details input','a'.repeat(32));await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='연결 등록').click());await page.waitForFunction(()=>document.body.innerText.includes('개인 계정을 학생 명단에 연결했습니다.'));await page.screenshot({path:path.join(output,'academy-student-activities.png'),fullPage:true});
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('NAVIGATE_TO',{detail:'inquiry_guide'})));await page.waitForFunction(()=>document.body.innerText.includes('AI 데이터 분석·프롬프트'));await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='AI 데이터 분석·프롬프트').click());await page.waitForSelector('iframe[src="https://jinhak.esteacher.kr/ai_prompt.html"]');assert.ok(await page.$('button.tab-btn'));
    const beforeAdmin=studentQueries.length;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('NAVIGATE_TO',{detail:'admin'})));await page.waitForFunction(()=>document.body.innerText.includes('학원 관리자만 이용할 수 있습니다.'));assert.equal(studentQueries.length,beforeAdmin);}
   if(role==='foreign-profile'){await page.waitForFunction(()=>document.body.innerText.includes('학원 이용 권한을 확인해 주세요.'));assert.equal(studentQueries.length,0);}
   if(role!=='admin')await page.screenshot({path:path.join(output,'academy-'+role+'.png'),fullPage:true});assert.deepEqual(errors,[]);results.push({role,studentQueries,pageErrors:errors.length,accountSwitchChecked:role==='admin'});await context.close();
  }
  console.log(JSON.stringify({base,results}));
 }finally{if(browser)await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
