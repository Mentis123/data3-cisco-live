(function(){
  "use strict";

  const ROOT = "/nav/practice-pulse/film-bible/";
  const copyStore = new Map();
  let manifest = null;
  let toastTimer = null;

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>\"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[char]);
  }

  function getPath(object, path){
    return path.split(".").reduce((value, key) => value && value[key], object);
  }

  function showToast(message="Copied"){
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
  }

  async function copyText(value, message){
    const text = String(value ?? "");
    try{
      await navigator.clipboard.writeText(text);
    }catch(error){
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast(message);
  }

  function setBackLinks(){
    const parent = window.location.pathname.replace(/\/film-bible\/?$/, "") || "/";
    [$("#backToPulse"), $("#backToPulseButton")].forEach(link => {
      if(link) link.href = parent;
    });
  }

  function buildHandoff(){
    const text = [
      "Continue the AI practice commercial-block film in the d3-agent-governance repository.",
      "",
      "Start by reading:",
      "- nav/practice-pulse/film-bible/production-manifest.json",
      "- nav/practice-pulse/film-bible/index.html",
      "- every file in nav/practice-pulse/film-bible/assets/.",
      "",
      "Current checkpoint: production is complete. All 11 Seedance motion sources are approved, the corrected Shot 03 downhill take is locked, the three vehicle beats are tightened to their spoken lines, and the 60-second master is assembled with the supplied ElevenLabs v3 performance, Graphite Ascend, native SFX, deterministic Data#3 overlays, SRT captions, fast picture fades, a final-instant score resolve, and text held fully legible for roughly 300 ms longer.",
      "",
      "Production contract: Pixio model pixio/seedance-2.5-direct, input_mode omni, 8 seconds, 720p, 16:9, generate_audio true, audio_list empty, watermark false. Native audio is synchronised diegetic SFX only—never music, narration, dialogue, vocals, or a logo sting. Thirteen paid renders used 8,112 credits; failed privacy-filter attempts cost zero.",
      "",
      "Do not alter the narrative, module colours, FY27/FY28/FY29 source percentages, reference order, or shot count without explaining the impact. Never print, paste, or commit PIXIO_API_KEY. Add exact text, approved brand artwork, captions, and portfolio numbers only in post-production. Record every generation ID, seed, reference order, cost, and review outcome."
    ].join("\n");
    $("#handoffPrompt").textContent = text;
    copyStore.set("handoffPrompt", text);
  }

  function renderTitle(){
    const title = manifest.titleTreatment;
    $("#titleEyebrow").textContent = title.eyebrow;
    $("#titleHeadline").innerHTML = escapeHtml(title.headline).replace("renewing AI", "renewing<br>AI");
    $("#titleSubhead").textContent = title.subhead;
    $("#titleDecision").textContent = title.decision;
    $("#titlePlacement").textContent = title.placement;
    $("#titleTimeline").textContent = title.timeline;
    $("#titleAnimation").textContent = title.animation;
    copyStore.set("titleTreatmentCopy", [title.decision,title.timeline,title.eyebrow,title.headline,title.subhead,title.placement,title.animation,title.typography].join("\n\n"));
  }

  function renderPortfolio(){
    const body = $("#portfolioTable tbody");
    body.innerHTML = manifest.portfolioMix.map(row => `
      <tr>
        <td>${escapeHtml(row.year)}</td>
        <td>${row.transactional}%</td>
        <td>${row.drawdown}%</td>
        <td>${row.capacity}%</td>
        <td>${row.standing}%</td>
      </tr>
      <tr aria-hidden="true">
        <td></td>
        <td colspan="4"><div class="portfolioBar">
          <i class="transactional" style="width:${row.transactional}%"></i>
          <i class="drawdown" style="width:${row.drawdown}%"></i>
          <i class="capacity" style="width:${row.capacity}%"></i>
          <i class="standing" style="width:${row.standing}%"></i>
        </div></td>
      </tr>
    `).join("");
  }

  function renderAssets(){
    $("#assetGrid").innerHTML = manifest.assets.map(asset => `
      <article class="assetCard ${asset.status === "derivative" ? "derivative" : ""}">
        <figure><a href="${ROOT + asset.file}" target="_blank" rel="noreferrer"><img src="${ROOT + asset.file}" alt="${escapeHtml(asset.purpose)}" loading="lazy"></a></figure>
        <div class="assetCopy">
          <div class="assetMeta"><h3>${escapeHtml(asset.title)}</h3><span class="assetStatus ${asset.status === "source" ? "source" : asset.status === "derivative" ? "derivative" : ""}">${escapeHtml(asset.status)}</span></div>
          <p>${escapeHtml(asset.purpose)}</p>
          <code>${escapeHtml(asset.file)}</code>
        </div>
      </article>
    `).join("");
  }

  function renderAudio(){
    const ids = ["seedanceSfxPolicy","stemWorkflow","voiceoverPrompt","elevenLabsPrompt","elevenLabsSettings","sunoPrompt","sunoExclude"];
    const keys = ["seedanceSfxPolicy","stemWorkflow","voiceover","elevenLabsPrompt","elevenLabsSettings","sunoPrompt","sunoExclude"];
    ids.forEach((id,index) => $("#"+id).textContent = manifest.audio[keys[index]]);
    const take = manifest.audio.referenceTake;
    $("#voiceoverReference").src = ROOT + take.file;
    $("#voiceoverReferenceStatus").textContent = take.status;
    $("#voiceoverReferenceMeta").textContent = `${take.durationSeconds}s · ${take.bitRateKbps} kbps · ${take.scriptWords} words · approximately ${take.paceWordsPerMinute} wpm`;
    $("#voiceoverReferenceReason").textContent = take.reason;
    $("#voiceoverTarget").textContent = manifest.audio.voiceoverTarget;
    $("#sunoMode").textContent = `Suno ${manifest.audio.sunoMode}`;
    $("#sunoSelection").textContent = manifest.audio.sunoSelection;
  }

  function apiPayload(prompt, references, seed){
    const imageUrls = references.map((reference,index) => `PIXIO_PUBLIC_URL_FOR_IMAGE_${index+1}`);
    return {
      providerId: manifest.model.providerId,
      modelId: manifest.model.modelId,
      params: {
        input_mode: manifest.model.inputMode,
        prompt,
        images_list: imageUrls,
        videos_list: [],
        audio_list: [],
        duration: manifest.model.duration,
        resolution: manifest.model.resolution,
        ratio: manifest.model.ratio,
        generate_audio: manifest.model.generateAudio,
        watermark: manifest.model.watermark,
        seed
      }
    };
  }

  function renderApi(){
    const templatePrompt = [manifest.continuity.seedanceGuardrails,"","SHOT-SPECIFIC OMNI INSTRUCTION GOES HERE"].join("\n");
    const payload = apiPayload(templatePrompt,["@image1","@image2","@image3"],42501);
    const apiText = JSON.stringify(payload,null,2);
    $("#apiTemplate").textContent = apiText;
    copyStore.set("apiTemplate", apiText);

    const workflow = [
      "1. Check https://beta.pixio.myapps.ai/status, then read the shot card and preserve its listed reference order.",
      "2. Upload each local reference with POST /api/v1/media using Authorization: Bearer $PIXIO_API_KEY.",
      "3. Put the returned clean public URLs into images_list in exactly that order.",
      "4. Confirm generate_audio is true and audio_list is empty, then POST the request to /api/v1/generations/estimate. Stop if the estimate is not 624 credits.",
      "5. POST the same body to /api/v1/generate only after the keyframe and reference order are approved.",
      "6. Poll GET /api/v1/generations/{contentId} until succeeded or failed.",
      "7. Download the output immediately and record shot, generation ID, seed, reference URLs/files, cost, status, and review notes. Demux the native SFX to a 48 kHz WAV.",
      "8. Reject any take containing music, speech, vocalisation, unexplained rhythm, or tonal contamination. For an alternate, change only the seed first and log the reason.",
      "9. Never print or commit PIXIO_API_KEY. Never place the key in client-side code or this website."
    ].join("\n");
    $("#workflowPrompt").textContent = workflow;
    copyStore.set("workflowPrompt", workflow);
  }

  function shotAccent(shot){
    if(shot.number === "07") return "#9b55ff";
    if(shot.number === "08") return "#00aeff";
    if(shot.number === "09") return "#25d5cf";
    if(shot.number === "10") return "#9b9bff";
    if(shot.number === "11") return "#daff00";
    return "#78dcff";
  }

  function renderShot(shot){
    const completeImagePrompt = `${manifest.continuity.masterLook}\n\nSHOT ${shot.number} — ${shot.title}\n${shot.imagePrompt}`;
    const completeMotionPrompt = `${manifest.continuity.seedanceGuardrails}\n\nSHOT ${shot.number} — ${shot.title}\n${shot.seedancePrompt}\n\nSHOT-SPECIFIC FOLEY\n${shot.sfxPrompt}`;
    const payload = JSON.stringify(apiPayload(completeMotionPrompt,shot.references,shot.seed),null,2);
    const imageKey = `shot-${shot.number}-image`;
    const motionKey = `shot-${shot.number}-motion`;
    const payloadKey = `shot-${shot.number}-payload`;
    copyStore.set(imageKey,completeImagePrompt);
    copyStore.set(motionKey,completeMotionPrompt);
    copyStore.set(payloadKey,payload);
    const postData = shot.postData ? `<div class="referencePlan"><strong>Deterministic post-production data</strong><ul>${shot.postData.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : "";
    const anchor = shot.anchorAsset ? `
      <div class="anchorPreview">
        <a href="${ROOT + shot.anchorAsset}" target="_blank" rel="noreferrer"><img src="${ROOT + shot.anchorAsset}" alt="Approved visual anchor for shot ${shot.number}" loading="lazy"></a>
        <div><strong>Approved anchor available</strong><span>${escapeHtml(shot.anchorAsset)}</span><span class="statusPill ready">Anchor ready</span></div>
      </div>` : `
      <div class="anchorPreview">
        <div aria-hidden="true" style="width:100%;aspect-ratio:16/9;border:1px dashed rgba(218,255,0,.35);border-radius:8px;display:grid;place-items:center;color:#daff00;font-size:10px;font-weight:900">KEYFRAME REQUIRED</div>
        <div><strong>Generate and approve this still before motion</strong><span>Use the complete GPT Images prompt below with the named style-lock files.</span><span class="statusPill">Keyframe required</span></div>
      </div>`;
    const motion = shot.videoAsset ? `
      <div class="shotMotion">
        <video controls playsinline preload="metadata">
          <source src="${ROOT + shot.videoAsset}" type="video/mp4">
        </video>
        <div><strong>Approved motion source</strong><span>${escapeHtml(shot.videoAsset)}</span><a href="${ROOT + shot.videoAsset}" download>Download clip</a></div>
      </div>` : "";
    return `
      <article class="shotCard" data-shot-status="${escapeHtml(shot.status)}" style="--shot-accent:${shotAccent(shot)}">
        <header class="shotTop">
          <div class="shotNumber">${escapeHtml(shot.number)}<small>${escapeHtml(shot.stage)}</small></div>
          <div class="shotTitle"><h3>${escapeHtml(shot.title)}</h3><p>Source use ${escapeHtml(shot.sourceUse)} · Seed ${shot.seed} · ${escapeHtml(shot.status)}</p></div>
          <div class="shotTime">${escapeHtml(shot.timeline)}</div>
        </header>
        <div class="shotBody">
          <div class="shotBriefs">
            <div class="shotBrief"><b>Voiceover</b><p class="voice">“${escapeHtml(shot.voiceover)}”</p></div>
            <div class="shotBrief"><b>Post overlay</b><p>${escapeHtml(shot.overlay)}</p></div>
            <div class="shotBrief"><b>Edit and sound</b><p>${escapeHtml(shot.edit)}</p></div>
            <div class="shotBrief sfx"><b>Seedance native SFX · no music or voice</b><p>${escapeHtml(shot.sfxPrompt)}</p></div>
          </div>
          ${anchor}
          ${motion}
          <div class="referencePlan"><strong>Omni reference order</strong><ul>${shot.references.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
          ${postData}
          <div class="promptTabs">
            <div class="promptBox"><div class="promptHead"><strong>GPT Images · complete keyframe prompt</strong><button class="copyButton" type="button" data-copy-store="${imageKey}">Copy</button></div><pre>${escapeHtml(completeImagePrompt)}</pre></div>
            <div class="promptBox"><div class="promptHead"><strong>Seedance 2.5 · complete Omni prompt</strong><button class="copyButton" type="button" data-copy-store="${motionKey}">Copy</button></div><pre>${escapeHtml(completeMotionPrompt)}</pre></div>
          </div>
          <details class="payloadBox"><summary>Open exact Pixio request payload</summary><div class="promptHead"><strong>Replace placeholder URLs after uploading the references in order</strong><button class="copyButton" type="button" data-copy-store="${payloadKey}">Copy JSON</button></div><pre>${escapeHtml(payload)}</pre></details>
        </div>
      </article>
    `;
  }

  function renderShots(){
    $("#shotList").innerHTML = manifest.shots.map(renderShot).join("");
  }

  function renderSources(){
    $("#sourceList").innerHTML = manifest.sources.map(source => `
      <a class="sourceCard" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
        <strong>${escapeHtml(source.title)}</strong><span>${escapeHtml(source.note)}</span>
      </a>
    `).join("");
  }

  function bindEvents(){
    document.addEventListener("click", event => {
      const button = event.target.closest("button");
      if(!button) return;
      if(button.dataset.copyTarget){
        const text = copyStore.get(button.dataset.copyTarget) || $("#"+button.dataset.copyTarget)?.innerText || "";
        copyText(text,"Copied");
      }
      if(button.dataset.copyManifest){
        copyText(getPath(manifest,button.dataset.copyManifest),"Copied");
      }
      if(button.dataset.copyStore){
        copyText(copyStore.get(button.dataset.copyStore),"Copied complete prompt");
      }
      if(button.dataset.shotFilter){
        const filter = button.dataset.shotFilter;
        $$("[data-shot-filter]").forEach(item => item.classList.toggle("active",item === button));
        $$(".shotCard").forEach(card => {
          card.hidden = filter !== "all" && card.dataset.shotStatus !== filter;
        });
      }
    });
  }

  async function init(){
    setBackLinks();
    bindEvents();
    try{
      const response = await fetch(ROOT+"production-manifest.json",{cache:"no-store"});
      if(!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
      manifest = await response.json();
      $("#projectStatus").textContent = manifest.project.status;
      buildHandoff();
      renderTitle();
      renderPortfolio();
      renderAssets();
      renderAudio();
      renderApi();
      renderShots();
      renderSources();
    }catch(error){
      $("#projectStatus").textContent = "Manifest unavailable";
      $("#shotList").innerHTML = `<article class="card"><h3>Production manifest could not be loaded</h3><p>${escapeHtml(error.message)}</p></article>`;
    }
  }

  init();
})();
