const days = ["一","二","三","四","五"];
  let periods = [];
  let times = [];
  let courses = [];
  let scheduleBackground = "#ffffff";
  let editCourseIndex = null;
  let colorPicker, recentColors = [];

  function renderPeriodSummary(){
    const summary = document.getElementById("periodSummary");
    summary.textContent = periods.length ? `目前 ${periods.length} 個節次` : "尚未設定節次";
  }

  function openPeriodModal(){
    const editor = document.getElementById("periodEditor");
    editor.innerHTML = "";

    if(periods.length === 0){
      const defaults = [
        ["第1節","08:10-08:50"],
        ["第2節","09:10-09:50"],
        ["第3節","10:10-10:50"],
        ["第4節","11:10-12:00"],
        ["第20節","12:00-12:10"],
        ["第5節","12:50-13:40"],
        ["第6節","13:50-14:40"],
        ["第7節","14:50-15:40"],
        ["第8節","15:50-16:40"]
      ];
      defaults.forEach(([name,time]) => addPeriodRow(name,time));
    }else{
      periods.forEach((period,i) => addPeriodRow(period, times[i] || ""));
    }

    document.getElementById("periodModal").classList.remove("hidden");
  }

  function closePeriodModal(){
    document.getElementById("periodModal").classList.add("hidden");
  }

  function addPeriodRow(name="", time=""){
    const editor = document.getElementById("periodEditor");
    const row = document.createElement("div");
    row.className = "flex gap-2 items-center";
    row.innerHTML = `
      <input type="text" value="${escapeHtml(name)}" placeholder="節次，例如 第1節"
        class="period-name border p-2 rounded flex-1 min-w-0" />
      <input type="text" value="${escapeHtml(time)}" placeholder="時間，例如 08:10-08:50"
        class="period-time border p-2 rounded flex-1 min-w-0" />
      <button type="button" class="remove-period text-red-500 text-xl px-1" title="刪除">×</button>
    `;
    row.querySelector(".remove-period").onclick = () => row.remove();
    editor.appendChild(row);
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function savePeriodsFromModal(){
    const rows = [...document.querySelectorAll("#periodEditor > div")];
    const newPeriods = [];
    const newTimes = [];

    rows.forEach(row => {
      const name = row.querySelector(".period-name").value.trim();
      const time = row.querySelector(".period-time").value.trim();
      if(name){
        newPeriods.push(name);
        newTimes.push(time);
      }
    });

    if(!newPeriods.length){
      alert("至少要設定一個節次。");
      return;
    }

    periods = newPeriods;
    times = newTimes;
    closePeriodModal();
    renderTable();
    renderPeriodSummary();
    autoSave();
  }

  // 保留舊函式名稱，避免舊程式呼叫時出錯
  function generatePeriods(){
    openPeriodModal();
  }

  function renderTable(){
    const container = document.getElementById('scheduleContainer');
    container.innerHTML='';
    container.style.backgroundColor = scheduleBackground || "#ffffff";
    const table=document.createElement('table');
    table.className='table-fixed border-collapse border border-gray-400 w-full text-center';

    // 表頭
    const thead=document.createElement('thead');
    let headRow=document.createElement('tr');
    headRow.innerHTML='<th class="border border-gray-400 p-2 w-24">節次/時間</th>';
    days.forEach(day=>{
      const th=document.createElement('th');
      th.className='border border-gray-400 p-2';
      th.textContent=`星期${day}`;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // 內容
    const tbody=document.createElement('tbody');
    periods.forEach((period,i)=>{
      const row=document.createElement('tr');
      const time=times[i];
      const firstCell=document.createElement('td');
      firstCell.className='border border-gray-400 p-2';
      firstCell.innerHTML=`<div class='font-bold'>${period}</div><div>${time}</div>`;
      row.appendChild(firstCell);

      days.forEach(day=>{
        const td=document.createElement('td');
        td.className='align-middle h-24 cursor-pointer';
        td.style.setProperty('background-color', '#ffffff', 'important');

        const course = courses.find(c =>
          c.day === day &&
          periods.indexOf(period) >= periods.indexOf(c.startPeriod) &&
          periods.indexOf(period) <= periods.indexOf(c.endPeriod)
        );

        if(course){
          td.classList.add('course-cell');
          td.style.setProperty('--course-color', course.color || '#a0e7e5');
          td.style.setProperty('background-color', course.color || '#a0e7e5', 'important');
          td.innerHTML=`<div class='flex flex-col items-center justify-center h-full text-center'>
            <div>${course.emoji} ${course.name}</div>
            <div>${course.teacher}</div>
            <div>${course.location}</div>
          </div>`;
        }

        td.onclick = () => {
          if(course){
            editCourseIndex = courses.indexOf(course);
            document.getElementById("deleteBtn").classList.remove("hidden");
            openModal(course.day, course.startPeriod, course);
          } else {
            editCourseIndex = null;
            document.getElementById("deleteBtn").classList.add("hidden");
            openModal(day, period);
          }
        };

        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    const daySelect=document.getElementById('courseDay');
    const startSelect=document.getElementById('courseStart');
    const endSelect=document.getElementById('courseEnd');
    daySelect.innerHTML='';
    startSelect.innerHTML='';
    endSelect.innerHTML='';
    days.forEach(day=>{ const opt=document.createElement('option'); opt.textContent=day; daySelect.appendChild(opt); });
    periods.forEach(p=>{
      let opt1=document.createElement('option'); opt1.textContent=p; startSelect.appendChild(opt1);
      let opt2=document.createElement('option'); opt2.textContent=p; endSelect.appendChild(opt2);
    });
  }

  function openModal(day, period, course=null){
    document.getElementById('courseModal').classList.remove('hidden');
    document.getElementById('modalTitle').textContent = course ? "編輯課程" : "新增課程";

    if(course){
      document.getElementById('courseEmoji').value=course.emoji;
      document.getElementById('courseName').value=course.name;
      document.getElementById('courseTeacher').value=course.teacher;
      document.getElementById('courseLocation').value=course.location;
      document.getElementById('courseDay').value=course.day;
      document.getElementById('courseStart').value=course.startPeriod;
      document.getElementById('courseEnd').value=course.endPeriod;
      document.getElementById('colorPreview').style.background=course.color;
      document.getElementById('colorHex').value=course.color;
    } else {
      document.getElementById('courseEmoji').value='';
      document.getElementById('courseName').value='';
      document.getElementById('courseTeacher').value='';
      document.getElementById('courseLocation').value='';
      document.getElementById('courseDay').value=day;
      document.getElementById('courseStart').value=period;
      document.getElementById('courseEnd').value=period;
      const randColor=getRandomColor();
      document.getElementById('colorPreview').style.background=randColor;
      document.getElementById('colorHex').value=randColor;
    }
  }

  function closeModal(){
    document.getElementById('courseModal').classList.add('hidden');
  }

  function saveCourse(){
    const emoji=document.getElementById('courseEmoji').value.trim();
    const name=document.getElementById('courseName').value.trim();
    const teacher=document.getElementById('courseTeacher').value.trim();
    const location=document.getElementById('courseLocation').value.trim();
    const day=document.getElementById('courseDay').value;
    const start=document.getElementById('courseStart').value;
    const end=document.getElementById('courseEnd').value;
    const color=document.getElementById('colorHex').value;

    if(!name) return;

    const courseData={emoji,name,teacher,location,day,startPeriod:start,endPeriod:end,color};

    if(editCourseIndex!==null){
      courses[editCourseIndex]=courseData;
    } else {
      courses.push(courseData);
    }

    addRecentColor(color);
    closeModal();
    renderTable();
    autoSave();
  }

  function deleteCourseInModal(){
    if(editCourseIndex!==null){
      courses.splice(editCourseIndex,1);
      editCourseIndex=null;
      closeModal();
      renderTable();
      autoSave();
    }
  }

  // =========================
  // Supabase 雲端同步設定
  // =========================
  const SUPABASE_URL = "https://vktuigxxlciclhvpxdjj.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mFPESpcqb220DML18yLeYw_HrRXeuqg";
  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  let currentUser = null;
  let saveTimer = null;

  function setSyncStatus(message, isError=false){
    const el = document.getElementById("syncStatus");
    el.textContent = message;
    el.className = "text-sm mt-2 " + (isError ? "text-red-500" : "text-gray-500");
  }

  function updateAuthUI(){
    const status = document.getElementById("authStatus");
    const login = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if(currentUser){
      status.textContent = "☁️ 已登入：" + (currentUser.email || "Google 帳號");
      login.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
    }else{
      status.textContent = "☁️ 尚未登入";
      login.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }
  }

  async function loginWithGoogle(){
    setSyncStatus("正在開啟 Google 登入...");
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if(error){
      console.error(error);
      setSyncStatus("登入失敗：" + error.message, true);
    }
  }

  async function logout(){
    const { error } = await supabaseClient.auth.signOut();
    if(error){
      setSyncStatus("登出失敗：" + error.message, true);
      return;
    }
    currentUser = null;
    updateAuthUI();
    setSyncStatus("已登出。");
  }

  function getScheduleData(){
    return {
      periods: periods || [],
      times: times || [],
      courses: courses || [],
      background: scheduleBackground || '#ffffff'
    };
  }

  function applyScheduleData(data){
    periods = Array.isArray(data?.periods) ? data.periods : [];
    times = Array.isArray(data?.times) ? data.times : [];
    courses = Array.isArray(data?.courses) ? data.courses : [];
    scheduleBackground = typeof data?.background === 'string' ? data.background : '#ffffff';
    renderTable();
    renderPeriodSummary();

  }

  async function saveSchedule(showAlert=true){
    const localData = getScheduleData();

    // 先保留本機備份，避免網路中斷時資料消失
    localStorage.setItem("mySchedule", JSON.stringify(localData));

    if(!currentUser){
      setSyncStatus("尚未登入，已暫存在此裝置。登入後即可雲端同步。");
      if(showAlert) alert("目前尚未登入，課表已暫存在此裝置。\n登入 Google 後就能跨裝置同步。");
      return;
    }

    setSyncStatus("☁️ 正在同步...");
    const { error } = await supabaseClient
      .from("schedules")
      .upsert({
        user_id: currentUser.id,
        periods: localData.periods,
        times: localData.times,
        courses: localData.courses,
        background: localData.background,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if(error){
      console.error(error);
      setSyncStatus("雲端同步失敗：" + error.message, true);
      if(showAlert) alert("雲端同步失敗，已保留本機資料。");
      return;
    }

    setSyncStatus("☁️ 已同步到雲端");
    if(showAlert) alert("課表已同步到雲端 ✅");
  }

  function autoSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveSchedule(false), 500);
  }

  async function loadSchedule(){
    // 先載入本機資料，讓原本的課表不會消失
    const saved = localStorage.getItem("mySchedule");
    if(saved){
      try{
        applyScheduleData(JSON.parse(saved));
      }catch(e){
        console.error("本機課表讀取失敗", e);
      }
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session?.user || null;
    updateAuthUI();

    if(!currentUser){
      if(!saved){
        generatePeriods();
      }
      return;
    }

    await loadCloudSchedule();
  }

  async function loadCloudSchedule(){
    if(!currentUser) return;

    setSyncStatus("☁️ 正在讀取雲端課表...");

    const { data, error } = await supabaseClient
      .from("schedules")
      .select("periods,times,courses,background")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if(error){
      console.error(error);
      setSyncStatus("讀取雲端課表失敗：" + error.message, true);
      return;
    }

    if(data){
      applyScheduleData(data);
      localStorage.setItem("mySchedule", JSON.stringify(getScheduleData()));
      setSyncStatus("☁️ 已載入雲端課表");
      return;
    }

    // 第一次登入：如果這台裝置原本有課表，就自動搬到雲端
    const localSaved = localStorage.getItem("mySchedule");
    if(localSaved){
      try{
        const localData = JSON.parse(localSaved);
        applyScheduleData(localData);
        await saveSchedule(false);
        setSyncStatus("☁️ 已將這台裝置的課表搬到雲端");
        return;
      }catch(e){
        console.error(e);
      }
    }

    if(periods.length === 0){
      generatePeriods();
    }
    await saveSchedule(false);
    setSyncStatus("☁️ 已建立新的雲端課表");
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();

    if(currentUser){
      // OAuth 回來後讀取雲端
      setTimeout(() => loadCloudSchedule(), 0);
    }else{
      setSyncStatus("已登出。");
    }
  });

  // =========================
  // 匯出完整課表
  // =========================
  // 不再直接截取原本的 HTML table。
  // 原本在部分筆電瀏覽器 / html2canvas 組合下，長表格底部可能出現
  // 橫向斷層或被裁切。這裡改成「依課表資料直接繪製 Canvas」，
  // 因此與螢幕寬度、左右捲動、sticky、overflow 都無關。
  function roundRectPath(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  function fitCanvasText(ctx,text,maxWidth,fontSize,weight='400'){
    let size=fontSize;
    ctx.font=`${weight} ${size}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
    while(size>9 && ctx.measureText(text).width>maxWidth){
      size-=1;
      ctx.font=`${weight} ${size}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
    }
    return size;
  }

  function drawCenteredText(ctx,text,x,y,maxWidth,fontSize,weight='400',color='#626977'){
    text=String(text ?? '');
    const size=fitCanvasText(ctx,text,maxWidth,fontSize,weight);
    ctx.font=`${weight} ${size}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
    ctx.fillStyle=color;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(text,x,y);
  }

  async function captureFullSchedule(){
    if(!periods.length) throw new Error('找不到課表');

    // 以目前桌面版課表的比例為基準，手機也一樣輸出完整的一～五。
    const exportWidth=Math.max(1100, Math.min(1400, window.innerWidth >= 900 ? window.innerWidth - 40 : 1100));
    const gap=5;
    const outerPad=4;
    const firstCol=110;
    const dayCol=(exportWidth - outerPad*2 - gap*5 - firstCol)/5;
    const headerH=58;
    const rowH=104;
    const height=outerPad*2 + headerH + periods.length*(rowH+gap);
    const dpr=Math.min(window.devicePixelRatio || 2, 2);

    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(exportWidth*dpr);
    canvas.height=Math.ceil(height*dpr);
    canvas.style.width=exportWidth+'px';
    canvas.style.height=height+'px';

    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    ctx.fillStyle=scheduleBackground || '#ffffff';
    ctx.fillRect(0,0,exportWidth,height);

    // 表頭
    const headerY=outerPad;
    const headerColor='#f0f1f7';
    const firstHeaderColor='#e9ebf3';
    roundRectPath(ctx,outerPad,headerY,firstCol,headerH,12);
    ctx.fillStyle=firstHeaderColor;
    ctx.fill();
    drawCenteredText(ctx,'節次/時間',outerPad+firstCol/2,headerY+headerH/2,firstCol-16,18,'700','#727886');

    days.forEach((day,j)=>{
      const x=outerPad+firstCol+gap+j*(dayCol+gap);
      roundRectPath(ctx,x,headerY,dayCol,headerH,12);
      ctx.fillStyle=headerColor;
      ctx.fill();
      drawCenteredText(ctx,`星期${day}`,x+dayCol/2,headerY+headerH/2,dayCol-20,18,'700','#626977');
    });

    periods.forEach((period,i)=>{
      const y=outerPad+headerH+gap+i*(rowH+gap);
      const time=times[i] || '';

      // 節次欄
      roundRectPath(ctx,outerPad,y,firstCol,rowH,13);
      ctx.fillStyle='#f8f9fb';
      ctx.fill();
      drawCenteredText(ctx,period,outerPad+firstCol/2,y+rowH/2-15,firstCol-12,16,'700','#626976');
      drawCenteredText(ctx,time,outerPad+firstCol/2,y+rowH/2+15,firstCol-12,15,'400','#6d7583');

      days.forEach((day,j)=>{
        const x=outerPad+firstCol+gap+j*(dayCol+gap);
        const course=courses.find(c =>
          c.day===day &&
          periods.indexOf(period)>=periods.indexOf(c.startPeriod) &&
          periods.indexOf(period)<=periods.indexOf(c.endPeriod)
        );

        roundRectPath(ctx,x,y,dayCol,rowH,13);
        ctx.fillStyle=course?.color || '#ffffff';
        ctx.fill();
        // 課程／空白格都只保留圓角色塊，不再畫灰色外框。
        ctx.strokeStyle='transparent';
        ctx.lineWidth=0;
        ctx.stroke();

        if(course){
          const centerX=x+dayCol/2;
          const maxText=dayCol-28;
          drawCenteredText(ctx,`${course.emoji || ''} ${course.name || ''}`.trim(),centerX,y+rowH/2-18,maxText,17,'700','#454b56');
          drawCenteredText(ctx,course.teacher || '',centerX,y+rowH/2+7,maxText,14,'400','#727987');
          drawCenteredText(ctx,course.location || '',centerX,y+rowH/2+32,maxText,14,'400','#969ca7');
        }
      });
    });

    return canvas;
  }

  async function downloadPDF(){
    try{
      const canvas=await captureFullSchedule();
      const imgData=canvas.toDataURL('image/png');
      const { jsPDF }=window.jspdf;
      const pdf=new jsPDF('l','pt','a4');
      const imgProps=pdf.getImageProperties(imgData);
      const pageWidth=pdf.internal.pageSize.getWidth();
      const pageHeight=pdf.internal.pageSize.getHeight();
      const scale=Math.min((pageWidth-24)/imgProps.width,(pageHeight-24)/imgProps.height);
      const pdfWidth=imgProps.width*scale;
      const pdfHeight=imgProps.height*scale;
      const x=(pageWidth-pdfWidth)/2;
      const y=(pageHeight-pdfHeight)/2;
      pdf.addImage(imgData,'PNG',x,y,pdfWidth,pdfHeight);
      pdf.save('我的課表.pdf');
    }catch(e){
      console.error(e);
      alert('匯出 PDF 時發生問題，請再試一次。');
    }
  }

  async function downloadImage(){
    try{
      const canvas=await captureFullSchedule();
      const imgData=canvas.toDataURL('image/png');
      const link=document.createElement('a');
      link.href=imgData;
      link.download='我的完整課表.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }catch(e){
      console.error(e);
      alert('儲存圖片時發生問題，請再試一次。');
    }
  }

  // =========================
  // 課表背景設定
  // =========================
  function openBackgroundModal(){
    const modal=document.getElementById("backgroundModal");
    const input=document.getElementById("backgroundColor");
    const hex=document.getElementById("backgroundHex");
    input.value = /^#[0-9a-fA-F]{6}$/.test(scheduleBackground) ? scheduleBackground : "#ffffff";
    hex.value = input.value;
    document.getElementById("backgroundPreview").style.backgroundColor=input.value;
    modal.classList.remove("hidden");
  }

  function closeBackgroundModal(){
    document.getElementById("backgroundModal").classList.add("hidden");
  }

  function setBackgroundColor(color){
    if(!/^#[0-9a-fA-F]{6}$/.test(color)) return;
    scheduleBackground=color;
    document.getElementById("backgroundColor").value=color;
    document.getElementById("backgroundHex").value=color;
    document.getElementById("backgroundPreview").style.backgroundColor=color;
    renderTable();
    autoSave();
  }

  function saveBackground(){
    const color=document.getElementById("backgroundHex").value.trim();
    if(!/^#[0-9a-fA-F]{6}$/.test(color)){
      alert("請輸入正確的 HEX 顏色，例如 #F7F8FC");
      return;
    }
    scheduleBackground=color;
    closeBackgroundModal();
    renderTable();
    autoSave();
  }

  // 顏色選擇器控制
  function openColorModal(){
    document.getElementById("colorModal").classList.remove("hidden");
    colorPicker.color.set(document.getElementById("colorHex").value || "#a0e7e5");
  }
  function closeColorModal(){
    document.getElementById("colorModal").classList.add("hidden");
    const c=colorPicker.color.hexString;
    document.getElementById("colorHex").value=c;
    document.getElementById("colorPreview").style.background=c;
  }

  window.onload=()=>{
    colorPicker=new iro.ColorPicker("#colorPicker",{
      width:250,
      layout:[
        { component: iro.ui.Box },
        { component: iro.ui.Slider, options:{sliderType:"hue"} }
      ],
      color:"#a0e7e5"
    });
    colorPicker.on("color:change",c=>{
      document.getElementById("colorHex").value=c.hexString;
      document.getElementById("colorPreview").style.background=c.hexString;
    });
    document.getElementById("colorHex").addEventListener("input",e=>{
      try{colorPicker.color.set(e.target.value);}catch{}
    });
    document.getElementById("colorPreview").addEventListener("click",openColorModal);
    document.getElementById("backgroundColor").addEventListener("input",e=>{
      document.getElementById("backgroundHex").value=e.target.value;
    });
    document.getElementById("backgroundHex").addEventListener("input",e=>{
      const v=e.target.value.trim();
      if(/^#[0-9a-fA-F]{6}$/.test(v)){
        document.getElementById("backgroundColor").value=v;
        document.getElementById("backgroundPreview").style.backgroundColor=v;
      }
    });
    loadSchedule();
  };

  function addRecentColor(color){
    if(!recentColors.includes(color)){
      recentColors.unshift(color);
      if(recentColors.length>5) recentColors.pop();
      renderRecentColors();
    }
  }

  function renderRecentColors(){
    const container=document.getElementById("recentColors");
    container.innerHTML="";
    recentColors.forEach(c=>{
      const div=document.createElement("div");
      div.className="w-6 h-6 rounded cursor-pointer border";
      div.style.background=c;
      div.onclick=()=>{
        document.getElementById("colorHex").value=c;
        document.getElementById("colorPreview").style.background=c;
        colorPicker.color.set(c);
      };
      container.appendChild(div);
    });
  }

  function getRandomColor(){
    const colors=["#a0e7e5","#b4f8c8","#fbe7c6","#ffaeae","#cbaacb"];
    return colors[Math.floor(Math.random()*colors.length)];
  }
