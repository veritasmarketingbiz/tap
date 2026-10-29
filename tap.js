/* Veritas Tap · shared engine for every café page (v2).
   Each page defines CONFIG and MENU, then loads ../tap.js. Edit once, all cafés update.
   Words on the page come from CONFIG.text (anything left out uses the default below).
   Data sent to the Google Sheet always uses the same internal codes (review_click, Loyalty, Members…), whatever the page calls them. */
(function(){
  const $ = id => document.getElementById(id);
  const source = (new URLSearchParams(location.search).get("s") || "table").slice(0, 40);
  const device = /iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "Other";
  const rs = n => "₹" + Math.round(n).toLocaleString("en-IN");
  const demo = !CONFIG.scriptUrl;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---- Words on the page (defaults; each café can override any of them in CONFIG.text)
  const T = Object.assign({
    openNow: "Open now", closedNow: "Closed now",
    reviewAsk: "Enjoyed your coffee? ☕", reviewText: "Share your love on Google", reviewSub: "Takes just 10 seconds",
    orderTitle: "Order now", orderText: "",
    instaTitle: "Tag us on Insta", instaText: "Post your pic & follow",
    waTitle: "Celebrate with us", waText: "Birthdays, anniversaries & parties",
    tileMenu: "Menu", tileWifi: "Wi-Fi", tileLoyalty: "Stamps", tileVip: "VIP",
    menuTitle: "Menu", addButton: "Add",
    wifiTitle: "Free Wi-Fi", wifiNetwork: "Network", wifiPassword: "Password", wifiCopy: "Copy password", wifiCopied: "✓ Password copied",
    loyaltyTitle: "Coffee Card", loyaltyPhone: "Your mobile number", loyaltyCode: "Today's code (ask at the counter)", loyaltyButton: "Add my stamp",
    vipLabel: "MEMBERS ONLY", vipTitle: "VIP Club", vipPerksTitle: "What you get as a VIP", vipButton: "👑 Join VIP Club",
    vipNote: "Free to join · No spam · Reply STOP anytime", vipDone: "You're in! Show this screen at the counter for your welcome offer.",
    formName: "Name", formWhatsapp: "WhatsApp number", formBirthday: "Birthday (optional)",
    celTitle: "🎉 Plan your celebration", celIntro: "Tell us a little and we'll get back to you on WhatsApp.", celButton: "Submit details", close: "Close",
    feedback: "Something not right? Tell the owner directly",
    cartView: "View order →", cartTitle: "Your order", sendOrder: "Send order on WhatsApp", keepBrowsing: "Keep browsing"
  },
  // older pages kept these words at the top level of CONFIG; still honoured
  ["reviewText", "orderText", "instaText", "waTitle", "waText"].reduce((o, k) => { if (CONFIG[k] != null) o[k] = CONFIG[k]; return o; }, {}),
  CONFIG.text || {});

  // ---- What to show (everything on unless the café turns it off)
  const show = Object.assign({ ordering: true, insta: true, celebrate: true, wifi: true, loyalty: true, vip: true, feedback: true }, CONFIG.show || {});
  if (CONFIG.ordering === false) show.ordering = false;
  if (!CONFIG.wifi) show.wifi = false;
  const ordering = show.ordering;

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
// the customer's own name + number, remembered on their phone for THIS café only (never shared across cafés)
const pk = "vt_profile_" + CONFIG.clientId;
let me = {};
try { me = JSON.parse(localStorage.getItem(pk) || "{}") || {}; } catch (e) {}
const remember = (phone, name) => { if (phone) me.phone = phone; if (name) me.name = name; try { localStorage.setItem(pk, JSON.stringify(me)); } catch (e) {} };
  const icon = k => `<svg aria-hidden="true"><use href="#i-${k || "cup"}"/></svg>`;
  const setText = (id, v) => { const e = $(id); if (e && v != null) e.textContent = v; };

  // ---- Apply config
  // main colour comes from CONFIG.brandColor (all other colours/fonts: the café's style.css)
  if (CONFIG.brandColor) { document.documentElement.style.setProperty("--brand", CONFIG.brandColor); document.querySelector('meta[name="theme-color"]').content = CONFIG.brandColor; }
  document.title = CONFIG.name;
  // every element marked data-t="key" gets the café's word for it
  document.querySelectorAll("[data-t]").forEach(e => { const v = T[e.dataset.t]; if (v != null && v !== "") e.textContent = v; });
  $("biz-name").textContent = CONFIG.name;
  document.querySelectorAll(".bn").forEach(e => e.textContent = CONFIG.name);
  $("biz-tag").textContent = CONFIG.tagline;
  // logo (image file in the café's folder) or the initial letter
  if (CONFIG.logo) { $("logo").classList.add("has-img"); $("logo").innerHTML = `<img src="${esc(CONFIG.logo)}" alt="">`; }
  else $("logo").textContent = CONFIG.initial;
  // hero picture: a photo of the café / signature dish instead of the coffee cup
  const cupwrap = document.querySelector(".cupwrap");
  if (CONFIG.heroImage && cupwrap) { cupwrap.classList.add("has-img"); cupwrap.innerHTML = `<img src="${esc(CONFIG.heroImage)}" alt="">`; }
  $("timings").textContent = CONFIG.timings;
  $("direct-offer").textContent = CONFIG.directOffer ? "🛵 " + CONFIG.directOffer : "";
  $("direct-offer").hidden = !CONFIG.directOffer || !ordering;
  setText("review-text", T.reviewText);
  setText("insta-sub", T.instaText);
  setText("wa-title", T.waTitle);
  setText("wa-sub", T.waText);
  setText("order-sub", T.orderText);
  $("loy-ribbon").textContent = CONFIG.loyalty.ribbon;
  $("loy-big").innerHTML = CONFIG.loyalty.big;
  $("perks").innerHTML = CONFIG.vipPerks.map(p => `<li><span aria-hidden="true">${p.e}</span><div><b>${p.t}</b><small>${p.s}</small></div></li>`).join("");
  if (CONFIG.wifi) { $("wifi-name").textContent = CONFIG.wifi.name; $("wifi-pass").textContent = CONFIG.wifi.password; }
  $("loy-short").textContent = CONFIG.loyalty.short || `${CONFIG.loyalty.stampsNeeded} stamps = reward`;
  $("loy-desc").textContent = CONFIG.loyalty.desc || `Thank you for coming back! Get a stamp on every visit. Collect ${CONFIG.loyalty.stampsNeeded} and ${CONFIG.loyalty.reward}.`;
  // consent texts always name the café (legal wording: not changed per café)
  $("consent-text").textContent = `I agree to receive offers and updates from ${CONFIG.name} on WhatsApp. I can stop anytime by replying STOP.`;
  $("review-btn").href = CONFIG.reviewUrl;
  $("insta-btn").href = CONFIG.instagram;
  $("wa-btn").href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(`Hi ${CONFIG.name}, ${CONFIG.waMessage || "I'd like to plan a celebration."}`);
  $("fb-btn").href = "https://wa.me/" + CONFIG.ownerWhatsapp + "?text=" + encodeURIComponent(`Feedback for ${CONFIG.name}: `);
  $("powered").href = CONFIG.poweredBy;
  if (demo) $("demo-note").hidden = false;

  // ---- Show / hide sections
  const hide = (on, ...els) => els.forEach(e => { if (e) e.hidden = !on; });
  const tile = h => document.querySelector(`.tile[href="${h}"]`);
  hide(show.wifi, $("wifi"), tile("#wifi"));
  hide(show.loyalty, $("loyalty"), tile("#loyalty"));
  hide(show.vip, $("club"), tile("#club"));
  hide(show.insta, $("insta-btn"));
  hide(show.celebrate, $("wa-btn"));
  hide(show.feedback, document.querySelector(".feedback"));
  hide(ordering, $("order-btn"));
  const tiles = document.querySelector(".tiles");
  if (tiles) { const n = [...tiles.children].filter(t => !t.hidden).length; tiles.style.gridTemplateColumns = `repeat(${Math.max(1, n)},1fr)`; }

  if (CONFIG.hours) {
    const h = new Date().getHours(), o = CONFIG.hours.open, c = CONFIG.hours.close;
    const open = o < c ? (h >= o && h < c) : (h >= o || h < c);
    $("open-text").textContent = open ? T.openNow : T.closedNow;
    $("open-badge").classList.toggle("closed", !open);
  } else $("open-badge").hidden = true;

  // ---- Tracking
  function send(payload){
    if (demo) return;
    const body = JSON.stringify(Object.assign({ clientId: CONFIG.clientId, source, device, vid, visit, phone: me.phone || "", name: me.name || "" }, payload));
    try { if (navigator.sendBeacon && navigator.sendBeacon(CONFIG.scriptUrl, body)) return; } catch(e){}
    fetch(CONFIG.scriptUrl, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body }).catch(()=>{});
  }
  const ev = (event, details) => send({ type: "event", event, details: details || "" });
  ev("page_open");

  // ---- Offer banner at the very top (e.g. Diwali). CONFIG.offerBanner = { text, sub, emoji, until: "2026-11-12", link: "#menu" }
  const ob = CONFIG.offerBanner;
  if (ob && ob.text && (!ob.until || new Date().toISOString().slice(0, 10) <= ob.until)) {
    const a = document.createElement("a");
    a.className = "obanner"; a.href = ob.link || "#menu";
    a.innerHTML = `<span class="oe" aria-hidden="true">${esc(ob.emoji || "🎉")}</span><span class="ot">${esc(ob.text)}${ob.sub ? `<small>${esc(ob.sub)}</small>` : ""}</span><span class="oa" aria-hidden="true">›</span>`;
    a.addEventListener("click", () => ev("offer_click", ob.text));
    const hero = document.querySelector(".hero");
    hero.parentNode.insertBefore(a, hero);
  }

  $("review-btn").addEventListener("click", () => ev("review_click"));
  function toast(t){ const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); }
  $("insta-btn").addEventListener("click", () => {
    ev("instagram_click");
    if (CONFIG.instaHandle) { try { navigator.clipboard.writeText(CONFIG.instaHandle).then(() => toast(`✓ ${CONFIG.instaHandle} copied. Paste it in your post or story!`), () => {}); } catch(e){} }
  });
  $("wa-btn").addEventListener("click", e => { e.preventDefault(); ev("whatsapp_click"); $("cel").hidden = false; });
  // tile clicks are logged with a fixed key (menu / wifi / loyalty / vip), not the café's word for it
  document.querySelectorAll(".tile").forEach(t => t.addEventListener("click", () => ev("tile_click", (t.getAttribute("href") || "").replace("#", "").replace("club", "vip") || t.textContent.trim())));
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
const occasions = CONFIG.occasions || ["Birthday", "Anniversary", "Party", "Other"];
let occ = occasions[0];
$("cel-occ").innerHTML = occasions.map((o, i) => `<button type="button" aria-pressed="${i === 0}" data-o="${esc(o)}">${esc(o)}</button>`).join("");
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
remember(phone, name);
send({ type: "enquiry", occasion: occ, eventDate: date, people, name, phone, consent: "yes", consentText: $("c-consent-text").textContent });
$("cel-form").hidden = true;
$("c-done-text").textContent = `Thank you, ${name}! ${CONFIG.name} will contact you on WhatsApp soon to plan your ${occ.toLowerCase()}.`;
$("c-done").hidden = false;
confetti();
});

// ---- Menu + cart (with ordering off, the menu is view-only: no Add buttons, no cart)
  const cart = {};
  const all = [];
  MENU.forEach((c, ci) => c.items.forEach((it, ii) => all.push(Object.assign({ id: ci + "-" + ii, cat: c.cat }, it))));
  let activeCat = MENU[0].cat;
  function renderTabs(){
    $("tabs").innerHTML = MENU.map(c => `<button type="button" role="tab" aria-selected="${c.cat === activeCat}" data-c="${esc(c.cat)}">${icon(c.icon)}${esc(c.cat)}</button>`).join("");
  }
  function qtyHtml(id){
    if (!ordering) return "";
    const q = cart[id] || 0;
    return q ? `<div class="qty"><button type="button" data-a="-" data-id="${id}" aria-label="Remove one">−</button><span class="q">${q}</span><button type="button" data-a="+" data-id="${id}" aria-label="Add one">+</button></div>`
             : `<div class="qty"><button type="button" class="add" data-a="+" data-id="${id}">${esc(T.addButton)}</button></div>`;
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
    const b = e.target.closest("[data-a]"); if (!b || !ordering) return;
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
    const disc = orderType === "Dine-in" ? 0 : Math.round(sub * (CONFIG.directDiscount || 0) / 100);
    return { sub, disc, total: sub - disc };
  }
  function renderCart(){
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    $("cartbar").hidden = !ordering || count === 0;
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
      `Name: ${$("o-name").value.trim() || "-"}`, `Phone: ${$("o-phone").value.trim() || "-"}`, `${extraLabel}: ${extra || "-"}`].join("\n");
    $("send-order").href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
  }
  document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => {
    orderType = b.dataset.t;
    document.querySelectorAll(".seg button").forEach(x => x.setAttribute("aria-pressed", x === b));
    $("o-extra-label").firstChild.textContent = orderType === "Dine-in" ? "Table number" : orderType === "Delivery" ? "Delivery address" : "Pickup time";
    renderSheet();
  }));
  ["o-name", "o-phone", "o-extra"].forEach(id => $(id).addEventListener("input", renderSheet));
  function closeSheet(){ $("sheet").hidden = true; }
  $("cart-open").addEventListener("click", () => { ev("cart_open", $("cart-count").textContent); renderSheet(); $("sheet").hidden = false; $("o-name").focus(); });
  $("sheet-close").addEventListener("click", closeSheet);
  $("sheet").addEventListener("click", e => { if (e.target.id === "sheet") closeSheet(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeSheet(); closeCel(); } });
  $("send-order").addEventListener("click", e => {
    const err = $("o-err"), name = $("o-name").value.trim(), phone = cleanPhone($("o-phone").value);
    if (!name) { e.preventDefault(); err.textContent = "Please enter your name."; $("o-name").focus(); return; }
    if (!phone) { e.preventDefault(); err.textContent = "Please enter a valid 10-digit WhatsApp number."; $("o-phone").focus(); return; }
    err.textContent = "";
    remember(phone, name);
    const t = totals(), ls = lines();
    send({ type: "order", orderType, items: ls.map(l => `${l.q} × ${l.n}`).join(", "), itemCount: ls.reduce((s, l) => s + l.q, 0), subtotal: t.sub, discount: t.disc, total: t.total, name, phone, extra: orderType === "Delivery" ? "" : $("o-extra").value.trim() });
  });

  // ---- Wi-Fi
  $("wifi-copy").addEventListener("click", () => {
    const b = $("wifi-copy");
    const done = () => { b.textContent = T.wifiCopied; setTimeout(() => b.textContent = T.wifiCopy, 2000); };
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
        const u = `${CONFIG.scriptUrl}?action=stamp&client=${encodeURIComponent(CONFIG.clientId)}&phone=${phone}&code=${encodeURIComponent(code)}&need=${CONFIG.loyalty.stampsNeeded}&source=${encodeURIComponent(source)}&vid=${encodeURIComponent(vid)}`;
        res = await (await fetch(u)).json();
      } catch(e) { res = { ok: false, error: "Couldn't reach the server. Please try again." }; }
    }
    btn.disabled = false; btn.textContent = T.loyaltyButton;
    if (!res.ok) { msg.textContent = res.error || "Something went wrong."; if (res.stamps != null) { shown = res.stamps; drawStamps(res.stamps); } return; }
    if (res.stamps < shown) shown = 0;
    remember(phone);
    drawStamps(res.stamps);
    msg.className = "ok";
    msg.textContent = res.reward ? `🎉 Card complete: ${CONFIG.loyalty.reward}! Show this screen at the counter.` : `Stamp added. ${CONFIG.loyalty.stampsNeeded - res.stamps} more to go.`;
    if (res.reward) confetti();
  });

  // ---- VIP Club (whatever the café calls it, sign-ups go to the Members tab)
  $("club-form").addEventListener("submit", e => {
    e.preventDefault();
    const err = $("f-err");
    const name = $("f-name").value.trim(), phone = cleanPhone($("f-phone").value);
    if (!name) { err.textContent = "Please enter your name."; $("f-name").focus(); return; }
    if (!phone) { err.textContent = "Please enter a valid 10-digit mobile number."; $("f-phone").focus(); return; }
    if (!$("f-consent").checked) { err.textContent = "Please tick the box to agree to WhatsApp messages."; return; }
    err.textContent = "";
    remember(phone, name);
    send({ type: "member", name, phone, birthday: $("f-bday").value, service: "", consent: "yes", consentText: $("consent-text").textContent });
    $("club-form").hidden = true; $("f-done").hidden = false;
    confetti();
  });

  // fill in what we already know about this customer
  if (me.phone) ["o-phone", "f-phone", "c-phone", "l-phone"].forEach(id => $(id).value = me.phone);
  if (me.name) ["o-name", "f-name", "c-name"].forEach(id => $(id).value = me.name);

  renderTabs(); renderItems(); renderCart();
})();
