document.addEventListener("DOMContentLoaded", async () => {
  const [sec,blocks] = await Promise.all([ddvApi.sections(),ddvApi.aboutBlocks()]);

  const hero = sec.about_hero || {};
  const storyMeta = sec.about_story_meta || {};
  const valuesMeta = sec.about_values_intro || {};
  const closing = sec.about_closing || {};

  // HERO
  if($("#aboutBreadcrumb")) $("#aboutBreadcrumb").textContent = hero.subtitle || "Trang chủ / Về chúng tôi";
  if($("#aboutHeroEyebrow")) $("#aboutHeroEyebrow").textContent = hero.button_text || "DON DUONG VILLAGE";
  if($("#aboutHeroTitle")) $("#aboutHeroTitle").textContent = hero.title || "Chăm sóc sức khỏe theo cách gần gũi hơn";
  if($("#aboutHeroBody")) $("#aboutHeroBody").textContent = hero.body || "Chúng tôi tin rằng việc quan tâm đến bản thân không cần bắt đầu từ những điều quá lớn lao, mà từ những lựa chọn phù hợp được gìn giữ mỗi ngày.";
  const heroMedia=$("#aboutHeroMedia");
  if(heroMedia){
    const img=hero.image_url||"assets/images/about-vision-default.webp";
    heroMedia.style.backgroundImage=`url('${resolvePath(img)}')`;
  }

  // STORY META
  if($("#aboutStoryEyebrow")) $("#aboutStoryEyebrow").textContent = storyMeta.subtitle || "CÂU CHUYỆN THƯƠNG HIỆU";
  if($("#aboutStorySignature")) $("#aboutStorySignature").textContent = storyMeta.body || "YOUR HEALTH, YOUR GREATEST WEALTH";

  // VALUES INTRO
  if($("#aboutValuesEyebrow")) $("#aboutValuesEyebrow").textContent = valuesMeta.subtitle || "GIÁ TRỊ CỐT LÕI";
  if($("#aboutValuesTitle")) $("#aboutValuesTitle").textContent = valuesMeta.title || "Những giá trị chúng tôi luôn gìn giữ";
  if($("#aboutValuesBody")) $("#aboutValuesBody").textContent = valuesMeta.body || "Chất lượng, minh bạch và sự tử tế là nền tảng trong từng sản phẩm và cách DON DUONG VILLAGE đồng hành cùng bạn.";

  // CLOSING
  if($("#aboutClosingEyebrow")) $("#aboutClosingEyebrow").textContent = closing.subtitle || "DON DUONG VILLAGE";
  if($("#aboutClosingTitle")) $("#aboutClosingTitle").textContent = closing.title || "Chăm sóc sức khỏe hôm nay, gìn giữ yêu thương ngày mai";
  const closingBtn=$("#aboutClosingBtn");
  if(closingBtn){
    closingBtn.textContent=(closing.button_text||"Khám phá sản phẩm")+" →";
    closingBtn.href=closing.button_url||"products.html";
  }

  // BLOCKS
  const story = blocks.find(x => x.block_type === "story");
  const missionVision = blocks.filter(x => x.block_type === "mission" || x.block_type === "vision");
  const values = blocks.filter(x => x.block_type === "value");
  const custom = blocks.filter(x => x.block_type === "content");

  const storySection = $("#aboutStorySection");
  if(storySection){
    if(!story){
      storySection.classList.add("hidden");
    }else{
      storySection.classList.remove("hidden");
      const storyImage = $("#aboutStoryImage");
      if(storyImage){
        storyImage.style.backgroundImage = `url('${resolvePath(story.image_url || "assets/images/about-story-default.webp")}')`;
      }
      if($("#aboutStoryTitle")) $("#aboutStoryTitle").textContent = story.title || "";
      const body=$("#aboutStoryBody");
      if(body){
        const paras=(story.body||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
        body.innerHTML=paras.map(p=>`<p>${safe(p)}</p>`).join("");
      }
    }
  }

  const mvSection=$("#aboutPurposeSection");
  const mvGrid=$("#missionVisionGrid");
  if(mvSection && mvGrid){
    if(!missionVision.length){
      mvSection.classList.add("hidden");
    }else{
      mvSection.classList.remove("hidden");
      mvGrid.innerHTML=missionVision.map((x,i)=>{
        const fallback=x.block_type==="mission"
          ?"assets/images/about-mission-default.webp"
          :"assets/images/about-vision-default.webp";
        const img=resolvePath(x.image_url||fallback);
        const heading=x.title || (x.block_type==="mission"?"Sứ mệnh":"Tầm nhìn");
        return `
        <article class="purpose-card ${x.block_type==="vision"?"vision-card":"mission-card"}">
          <div class="purpose-card-media" style="background-image:url('${img}')"></div>
          <div class="purpose-card-inner">
            <div class="purpose-index">${String(i+1).padStart(2,"0")}</div>
            <h3>${safe(heading)}</h3>
            <p>${safe(x.body||"")}</p>
          </div>
        </article>`;
      }).join("");
    }
  }

  const valueSection=$("#aboutPrinciplesSection");
  const valueGrid=$("#aboutValuesGrid");
  if(valueSection && valueGrid){
    if(!values.length){
      valueSection.classList.add("hidden");
    }else{
      valueSection.classList.remove("hidden");
      valueGrid.innerHTML=values.map((x,i)=>`
        <div class="principle-card">
          <span class="principle-number">${String(i+1).padStart(2,"0")}</span>
          <h3>${safe(x.title||"")}</h3>
          <p>${safe(x.body||"")}</p>
        </div>
      `).join("");
    }
  }

  const customWrap=$("#aboutCustomBlocks");
  if(customWrap){
    customWrap.innerHTML=custom.map((x,i)=>`
      <section class="section about-custom-section ${i%2?"about-custom-alt":""}">
        <div class="container about-custom-grid ${!x.image_url?"no-image":""}">
          ${x.image_url?`<div class="about-custom-image" style="background-image:url('${resolvePath(x.image_url)}')"></div>`:""}
          <div class="about-custom-copy">
            <div class="eyebrow">DON DUONG VILLAGE</div>
            <h2>${safe(x.title||"")}</h2>
            ${(x.body||"").split(/\n+/).map(p=>p.trim()).filter(Boolean).map(p=>`<p>${safe(p)}</p>`).join("")}
          </div>
        </div>
      </section>
    `).join("");
  }
});