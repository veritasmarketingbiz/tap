/* Veritas Tap · shared engine for every café page. Each page defines CONFIG and MENU, then loads ../tap.js. Edit once, all cafés update. */
(function(){
  const $ = id => document.getElementById(id);
  const source = (new URLSearchParams(location.search).get("s") || "table").slice(0, 40);
  const device = /iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "Other";
  const rs = n => "₹" + Math.round(n).toLocaleString("en-IN");
  const demo = !CONFIG.scriptUrl;
// anonymous visitor ID on this phone (no name or number) + how many different days it opened this café's page
let vid = "", visit = 1;
try {
const today = new Date().toISOString().slice(0, 10), kv = "vt_visits_" + CONFIG.clientId, kl = "vt_last_" + CONFIG.clientId;
vid = localStorage.getItem("vt_vid") || "";
if (!vid) { vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem("vt_vid", vid); }
visit = +localStorage.getItem(kv) || 0;
if (localStorage.getItem(kl) !== today) { visit++; localStorage.setItem(kv, visit); localStorage.setItem(kl, today); }
visit = visit || 1;
} catch (e) {}
  const icon = k => `<svg aria-hidden="true"><use href="#i-${k || "cup"}"/></svg>`;

  // ---- Apply config
  document.documentElement.style.setProperty("--brand", CONFIG.brandColor);
  document.querySelector('meta[name="theme-color"]').content = CONFIG.brandColor;
  document.title = CONFIG.name;
  $("biz-name").textContent = CONFIG.name;
  document.querySelectorAll(".bn").forEach(e => e.textContent = CONFIG.name);
  $("biz-tag").textContent = CONFIG.tagline;
  $("logo").textContent = CONFIG.initial;
  $("timings").textContent = CONFIG.timings;
  $("direct-offer").textContent = "🛵 " + CONFIG.directOffer;
  $("review-text").textContent = CONFIG.reviewText;
  $("insta-sub").textContent = CONFIG.instaText;
  $("loy-ribbon").textContent = CONFIG.loyalty.ribbon;
  $("loy-big").innerHTML = CONFIG.loyalty.big;
  $("perks").innerHTML = CONFIG.vipPerks.map(p => `<li><span aria-hidden="true">${p.e}</span><div><b>${p.t}</b><small>${p.s}</small></div></li>`).join("");
  if (!CONFIG.wifi) { $("wifi").hidden = true; $("wifi-tile").hidden = true; }
  if (CONFIG.wifi) { $("wifi-name").textContent = CONFIG.wifi.name; $("wifi-pass").textContent = CONFIG.wifi.password; }
  $("loy-short").textContent = `${CONFIG.loyalty.stampsNeeded} stamps = reward`;
  $("loy-desc").textContent = `Thank you for coming back! Get a stamp on every visit. Collect ${CONFIG.loyalty.stampsNeeded} and ${CONFIG.loyalty.reward}.`;
  $("consent-text").textContent = `I agree to receive offers and updates from ${CONFIG.name} on WhatsApp. I can stop anytime by replying STOP.`;
  $("review-btn").href = CONFIG.reviewUrl;
  $("insta-btn").href = CONFIG.instagram;
  $("wa-btn").href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(`Hi ${CONFIG.name}, ${CONFIG.waMessage}`);
  $("wa-title").textContent = CONFIG.waTitle;
  $("wa-sub").textContent = CONFIG.waText;
  $("order-sub").textContent = CONFIG.orderText;
  $("fb-btn").href = "https://wa.me/" + CONFIG.ownerWhatsapp + "?text=" + encodeURIComponent(`Feedback for ${CONFIG.name}: `);
  $("powered").href = CONFIG.poweredBy;
  if (demo) $("demo-note").hidden = false;
  if (CONFIG.hours) {
    const h = new Date().getHours(), o = CONFIG.hours.open, c = CONFIG.hours.close;
    const open = o < c ? (h >= o && h < c) : (h >= o || h < c);
    $("open-text").textContent = open ? "Open now" : "Closed now";
    $("open-badge").classList.toggle("closed", !open);
  } else $("open-badge").hidden = true;

  // ---- Tracking
  function send(payload){
    if (demo) return;
    const body = JSON.stringify(Object.assign({ clientId: CONFIG.clientId, source, device, vid, visit }, payload));
    try { if (navigator.sendBeacon && navigator.sendBeacon(CONFIG.scriptUrl, body)) return; } catch(e){}
    fetch(CONFIG.scriptUrl, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body }).catch(()=>{});
  }
  const ev = (event, details) => send({ type: "event", event, details: details || "" });
  ev("page_open");
  $("review-btn").addEventListener("click", () => ev("review_click"));
  function toast(t){ const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); }
  $("insta-btn").addEventListener("click", () => {
    ev("instagram_click");
    if (CONFIG.instaHandle) { try { navigator.clipboard.writeText(CONFIG.instaHandle).then(() => toast(`✓ ${CONFIG.instaHandle} copied. Paste it in your post or story!`), () => {}); } catch(e){} }
  });
  $("wa-btn").addEventListener("click", e => { e.preventDefault(); ev("whatsapp_click"); $("cel").hidden = false; });
document.querySelectorAll(".tile").forEach(t => t.addEventListener("click", () => ev("tile_click", t.textContent.trim())));
  $("order-btn").addEventListener("click", () => ev("order_now_click"));
  $("fb-btn").addEventListener("click", () => ev("feedback_click"));

  const cleanPhone = v => { let p = String(v).replace(/\D/g, ""); if (p.length === 12 && p.startsWith("91")) p = p.slice(2); return /^[6-9]\d{9}$/.test(p) ? p : ""; };

  function confetti(){
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cols = ["#C8813A", "#E8A93B", "#9C3D22", "#3FA36B", "#F3E2C7"];
    for (let k = 0; k < 28; k++) {
      const s = document.createElement("span");
      s.className = "confetti";
      s.style.left = Math.random() * 100 + "vw";
      s.style.background = cols[k % cols.length];
      s.style.setProperty("--x", (Math.random() * 120 - 60) + "px");
      s.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      s.style.animationDelay = Math.random() * .3 + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }

  // ---- Celebration enquiry (saved to the Veritas Sheet + email alert; nothing goes to WhatsApp)
let occ = CONFIG.occasions[0];
$("cel-occ").innerHTML = CONFIG.occasions.map((o, i) => `<button type="button" aria-pressed="${i === 0}" data-o="${o}">${o}</button>`).join("");
$("cel-occ").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; occ = b.dataset.o; $("cel-occ").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); });
$("c-consent-text").textContent = `Share my details with ${CONFIG.name} to plan my celebration and reply to me on WhatsApp.`;
const closeCel = () => { $("cel").hidden = true; if (!$("c-done").hidden) { $("cel-form").reset(); $("cel-form").hidden = false; $("c-done").hidden = true; } };
$("cel-close").addEventListener("click", closeCel);
$("cel").addEventListener("click", e => { if (e.target.id === "cel") closeCel(); });
$("cel-form").addEventListener("submit", e => {
e.preventDefault();
const err = $("c-err"), name = $("c-name").value.trim(), phone = cleanPhone($("c-phone").value), date = $("c-date").value, people = $("c-people").value;
if (!name) { err.textContent = "Please enter your name."; $("c-name").focus(); return; }
if (!phone) { err.textContent = "Please enter a valid 10-digit WhatsApp number."; $("c-phone").focus(); return; }
if (!$("c-consent").checked) { err.textContent = "Please tick the box so we can reply to you."; return; }
err.textContent = "";
send({ type: "enquiry", occasion: occ, eventDate: date, people, name, phone, consent: "yes", consentText: $("c-consent-text").textContent });
$("cel-form").hidden = true;
$("c-done-text").textContent = `Thank you, ${name}! ${CONFIG.name} will contact you on WhatsApp soon to plan your ${occ.toLowerCase()}.`;
$("c-done").hidden = false;
confetti();
});

// ---- Menu + cart
  const cart = {};
  const all = [];
  MENU.forEach((c, ci) => c.items.forEach((it, ii) => all.push(Object.assign({ id: ci + "-" + ii, cat: c.cat }, it))));
  let activeCat = MENU[0].cat;
  function renderTabs(){
    $("tabs").innerHTML = MENU.map(c => `<button type="button" role="tab" aria-selected="${c.cat === activeCat}" data-c="${c.cat}">${icon(c.icon)}${c.cat}</button>`).join("");
  }
  function qtyHtml(id){
    const q = cart[id] || 0;
    return q ? `<div class="qty"><button type="button" data-a="-" data-id="${id}" aria-label="Remove one">−</button><span class="q">${q}</span><button type="button" data-a="+" data-id="${id}" aria-label="Add one">+</button></div>`
             : `<div class="qty"><button type="button" class="add" data-a="+" data-id="${id}">Add</button></div>`;
  }
  function renderItems(popId){
    $("items").innerHTML = all.filter(i => i.cat === activeCat).map(i => `
      <div class="item">
        <div class="thumb">${icon(i.i)}<span class="dot ${i.v ? "v" : "n"}" title="${i.v ? "Veg" : "Non-veg"}" aria-label="${i.v ? "Veg" : "Non-veg"}"></span></div>
        <div class="info"><div class="nm">${i.n}</div><div class="ds">${i.d}</div><div class="price">${rs(i.p)}</div></div>
        <div data-row="${i.id}">${qtyHtml(i.id)}</div>
      </div>`).join("");
    if (popId) { const q = document.querySelector(`[data-row="${popId}"] .q`); if (q) q.classList.add("pop"); }
  }
  $("tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; activeCat = b.dataset.c; renderTabs(); renderItems(); });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.a === "+") ev("add_to_cart", all.find(x => x.id === id).n);
cart[id] = Math.max(0, (cart[id] || 0) + (b.dataset.a === "+" ? 1 : -1));
    if (!cart[id]) delete cart[id];
    renderItems(id); renderCart();
  });

  let orderType = "Dine-in";
  const lines = () => Object.keys(cart).map(id => { const i = all.find(x => x.id === id); return { n: i.n, q: cart[id], t: i.p * cart[id] }; });
  function totals(){
    const sub = lines().reduce((s, l) => s + l.t, 0);
    const disc = orderType === "Dine-in" ? 0 : Math.round(sub * CONFIG.directDiscount / 100);
    return { sub, disc, total: sub - disc };
  }
  function renderCart(){
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    $("cartbar").hidden = count === 0;
    const t = totals();
    $("cart-count").textContent = `${count} item${count > 1 ? "s" : ""} · ${rs(t.sub)}`;
    if (!count) closeSheet();
    renderSheet();
  }
  function renderSheet(){
    const ls = lines(), t = totals();
    $("sheet-items").innerHTML = ls.map(l => `<div class="sum"><span>${l.q} × ${l.n}</span><span class="price">${rs(l.t)}</span></div>`).join("");
    $("s-sub").textContent = rs(t.sub);
    $("s-disc-row").hidden = !t.disc;
    $("s-disc-label").textContent = `Direct order discount (${CONFIG.directDiscount}%)`;
    $("s-disc").textContent = "−" + rs(t.disc);
    $("s-total").textContent = rs(t.total);
    const extra = $("o-extra").value.trim();
    const extraLabel = orderType === "Dine-in" ? "Table" : orderType === "Delivery" ? "Address" : "Pickup time";
    const msg = [`New ${orderType} order — ${CONFIG.name}`, "", ...ls.map(l => `${l.q} × ${l.n} — ${rs(l.t)}`), "",
      `Subtotal: ${rs(t.sub)}`, ...(t.disc ? [`Direct order discount: −${rs(t.disc)}`] : []), `Total: ${rs(t.total)}`, "",
      `Name: ${$("o-name").value.trim() || "-"}`, `${extraLabel}: ${extra || "-"}`].join("\n");
    $("send-order").href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
  }
  document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => {
    orderType = b.dataset.t;
    document.querySelectorAll(".seg button").forEach(x => x.setAttribute("aria-pressed", x === b));
    $("o-extra-label").firstChild.textContent = orderType === "Dine-in" ? "Table number" : orderType === "Delivery" ? "Delivery address" : "Pickup time";
    renderSheet();
  }));
  ["o-name", "o-extra"].forEach(id => $(id).addEventListener("input", renderSheet));
  function closeSheet(){ $("sheet").hidden = true; }
  $("cart-open").addEventListener("click", () => { ev("cart_open", $("cart-count").textContent); renderSheet(); $("sheet").hidden = false; $("o-name").focus(); });
  $("sheet-close").addEventListener("click", closeSheet);
  $("sheet").addEventListener("click", e => { if (e.target.id === "sheet") closeSheet(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeSheet(); closeCel(); } });
  $("send-order").addEventListener("click", () => { const t = totals(), ls = lines(); send({ type: "order", orderType, items: ls.map(l => `${l.q} × ${l.n}`).join(", "), itemCount: ls.reduce((s, l) => s + l.q, 0), subtotal: t.sub, discount: t.disc, total: t.total, name: $("o-name").value.trim(), extra: orderType === "Delivery" ? "" : $("o-extra").value.trim() }); });

  // ---- Wi-Fi
  $("wifi-copy").addEventListener("click", () => {
    const b = $("wifi-copy");
    const done = () => { b.textContent = "✓ Password copied"; setTimeout(() => b.textContent = "Copy password", 2000); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($("wifi-pass")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected, now copy it"; };
    try { navigator.clipboard.writeText(CONFIG.wifi.password).then(done, fallback); } catch(e){ fallback(); }
    ev("wifi_copy");
  });

  // ---- Loyalty
  const demoStamps = {};
  let shown = 0;
  function drawStamps(n){
    const need = CONFIG.loyalty.stampsNeeded;
    $("stamps").innerHTML = Array.from({ length: need }, (_, i) => `<span class="stamp ${i === need - 1 ? "free" : ""} ${i < n ? "on" : ""} ${i < n && i >= shown ? "new" : ""}" aria-hidden="true">${i < n ? `<svg><use href="#u-stamp"/></svg>` : i === need - 1 ? "FREE" : i + 1}</span>`).join("")
      + `<span style="position:absolute;left:-9999px">${n} of ${need} stamps</span>`;
    shown = n;
  }
  drawStamps(0);
  $("l-btn").addEventListener("click", async () => {
    const msg = $("l-msg"); msg.className = "err";
    const phone = cleanPhone($("l-phone").value), code = $("l-code").value.trim();
    if (!phone) { msg.textContent = "Please enter a valid 10-digit mobile number."; return; }
    if (!code) { msg.textContent = "Ask the counter for today's code."; return; }
    const btn = $("l-btn"); btn.disabled = true; btn.textContent = "Adding…";
    let res;
    if (demo) {
      if (code !== "1234") res = { ok: false, error: "Wrong code. Please check with the counter." };
      else { demoStamps[phone] = ((demoStamps[phone] || 0) % CONFIG.loyalty.stampsNeeded) + 1; res = { ok: true, stamps: demoStamps[phone], reward: demoStamps[phone] === CONFIG.loyalty.stampsNeeded }; }
    } else {
      try {
        const u = `${CONFIG.scriptUrl}?action=stamp&client=${encodeURIComponent(CONFIG.clientId)}&phone=${phone}&code=${encodeURIComponent(code)}&need=${CONFIG.loyalty.stampsNeeded}&source=${encodeURIComponent(source)}`;
        res = await (await fetch(u)).json();
      } catch(e) { res = { ok: false, error: "Couldn't reach the server. Please try again." }; }
    }
    btn.disabled = false; btn.textContent = "Add my stamp";
    if (!res.ok) { msg.textContent = res.error || "Something went wrong."; if (res.stamps != null) { shown = res.stamps; drawStamps(res.stamps); } return; }
    if (res.stamps < shown) shown = 0;
    drawStamps(res.stamps);
    msg.className = "ok";
    msg.textContent = res.reward ? `🎉 Card complete: ${CONFIG.loyalty.reward}! Show this screen at the counter.` : `Stamp added. ${CONFIG.loyalty.stampsNeeded - res.stamps} more to go.`;
    if (res.reward) confetti();
  });

  // ---- VIP Club
  $("club-form").addEventListener("submit", e => {
    e.preventDefault();
    const err = $("f-err");
    const name = $("f-name").value.trim(), phone = cleanPhone($("f-phone").value);
    if (!name) { err.textContent = "Please enter your name."; $("f-name").focus(); return; }
    if (!phone) { err.textContent = "Please enter a valid 10-digit mobile number."; $("f-phone").focus(); return; }
    if (!$("f-consent").checked) { err.textContent = "Please tick the box to agree to WhatsApp messages."; return; }
    err.textContent = "";
    send({ type: "member", name, phone, birthday: $("f-bday").value, service: "", consent: "yes", consentText: $("consent-text").textContent });
    $("club-form").hidden = true; $("f-done").hidden = false;
    confetti();
  });

  renderTabs(); renderItems(); renderCart();
})();
