import { Markup } from 'telegraf';

// ─── BO'LIMLAR ────────────────────────────────────────────────────
export const SECTIONS: Record<string, { label: string; subs: string[]; guarantee: string }> = {
  sec_0: {
    label: "🟥 Jinoiy va Ma'muriy Muammolar",
    guarantee: "🔒 Sizning shaxsingiz va ma'lumotlaringiz 100% SIR saqlanishi kafolatlanadi.",
    subs: ["⚖️ Jinoiy Ish Qo'zg'atish", "🌐 Kiber-jinoyat va Firibgarlik", "🏛️ Ma'muriy Jazo"],
  },
  sec_1: {
    label: "🟧 Fuqarolik Huquqlari",
    guarantee: "🔒 Xavfsizlik kafolatlangan. Mulk, oila, mehnat nizolari bo'yicha tezkor huquqiy yordam.",
    subs: ["🏠 Mulk va Uy-joy Nizolari", "👨‍👩‍👧 Oilaviy Huquqlar", "💼 Mehnat Nizolari"],
  },
  sec_2: {
    label: "🟨 Biznes va Soliq",
    guarantee: "🔒 Xavfsizlik kafolatlangan. Kontrakt, stipendiya yoki o'qishdagi nohaqliklar bo'yicha tezkor yordam bo'limi.",
    subs: ["🏢 Kompaniya Ro'yxati", "💰 Soliq Muammolari", "📜 Shartnoma Nizolari"],
  },
  sec_3: {
    label: "🟩 Davlat Xizmatlari",
    guarantee: "🔒 Xavfsizlik kafolatlangan. Ish joyidagi aldanib qolishlar, maosh berilmasligi yoki noqonuniy haydash bo'yicha yordam bo'limi.",
    subs: ["📋 Hujjat Rasmiylashtirish", "🎓 Ta'lim va Stipendiya", "🏥 Tibbiy Yordam"],
  },
  sec_4: {
    label: "🟦 Ijtimoiy Yordam",
    guarantee: "🔒 Xavfsizlik kafolatlangan. Yoshlar daftari, grantlar, kredit ajratilishi yoki oilaviy huquqiy nizolar bo'yicha yordam bo'limi.",
    subs: ["♿ Nogironlik Nafaqasi", "👴 Pensiya Masalalari", "👶 Bola Nafaqasi"],
  },
  sec_5: {
    label: "🟪 Boshqa Muammolar",
    guarantee: "🔒 Xavfsizlik va sir saqlanishi 100% kafolatlanadi. Bolalarga nisbatan zo'ravonlik, kamsitish, bepul ta'lim ololmaslik yoki davlat tomonidan beriladigan nafaqa va imtiyozlardagi muammolar bo'yicha yordam bo'limi.",
    subs: ["🌍 Migratsiya va Pasport", "🔧 Kommunal Xizmatlar", "❓ Boshqa Savol"],
  },
};

export const SECTION_KEYS = Object.keys(SECTIONS);

// ─── INLINE: Asosiy menyu ─────────────────────────────────────────
export function buildMainMenuInline() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📝 Ariza berish', 'menu_apply')],
    [Markup.button.callback('🔑 Admin Login', 'menu_admin')],
  ]);
}

// ─── INLINE: 6 ta bo'lim ─────────────────────────────────────────
export function buildSectionsInlineKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(SECTIONS['sec_0'].label, 'sec_0')],
    [Markup.button.callback(SECTIONS['sec_1'].label, 'sec_1')],
    [Markup.button.callback(SECTIONS['sec_2'].label, 'sec_2')],
    [Markup.button.callback(SECTIONS['sec_3'].label, 'sec_3')],
    [Markup.button.callback(SECTIONS['sec_4'].label, 'sec_4')],
    [Markup.button.callback(SECTIONS['sec_5'].label, 'sec_5')],
    [Markup.button.callback('🔙 Bosh menyu', 'back_to_main')],
  ]);
}

// ─── INLINE: Ichki bo'limlar ─────────────────────────────────────
export function buildSubSectionsInlineKeyboard(secKey: string) {
  const subs = SECTIONS[secKey]?.subs ?? [];
  return Markup.inlineKeyboard([
    ...subs.map((sub, i) => [Markup.button.callback(sub, `sub_${secKey}_${i}`)]),
    [Markup.button.callback('🔙 Bo\'limlarga qaytish', 'back_to_sections')],
  ]);
}

// ─── REPLY: Telefon tugmasi ───────────────────────────────────────
export const phoneKeyboard = Markup.keyboard([
  [Markup.button.contactRequest('📱 Telefon raqamni yuborish')],
]).resize();

// ─── REPLY: Admin panel ───────────────────────────────────────────
export const adminMenuKeyboard = Markup.keyboard([
  ['📋 Barcha Arizalar', '⏳ Kutayotganlar'],
  ['🚪 Chiqish'],
]).resize();

// ─── REPLY: Bekor qilish ─────────────────────────────────────────
export const cancelKeyboard = Markup.keyboard([['❌ Bekor qilish']]).resize();
