import { Injectable, Logger } from '@nestjs/common';
import { Update, Start, On, Hears, Ctx, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { DatabaseService } from '../database/database.service';
import { SessionService } from './session.service';
import {
  SECTIONS,
  buildMainMenuInline,
  buildSectionsInlineKeyboard,
  buildSubSectionsInlineKeyboard,
  phoneKeyboard,
  adminMenuKeyboard,
  cancelKeyboard,
} from './bot.constants';

const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map((id) => id.trim());
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

// ─── XABAR SHABLONLARI ─────────────────────────────────────────────
const HEADER =
  `┌──────────────────────────────┐\n` +
  `│  ⚖️   <b>HUQUQIY YORDAM MARKAZI</b>  │\n` +
  `└──────────────────────────────┘`;

const WELCOME_NEW =
  HEADER + `\n\n` +
  `👋 <b>Assalomu alaykum!</b>\n\n` +
  `Botdan foydalanish uchun avval ro'yxatdan o'ting.\n\n` +
  `✏️ <b>Ism va Familiyangizni</b> kiriting:\n` +
  `<i>Masalan: Alisher Valiyev</i>`;

const WELCOME_BACK = (name: string) =>
  HEADER + `\n\n` +
  `👋 Xush kelibsiz, <b>${name}</b>!\n\n` +
  `Qanday yordam kerak? 👇`;

const SECTIONS_MSG =
  `╔════════════════════════════╗\n` +
  `║  📂  <b>BO'LIM TANLANG</b>          ║\n` +
  `╚════════════════════════════╝\n\n` +
  `Muammongizga mos bo'limni tanlang 👇`;

const subsMsg = (label: string, guarantee: string) =>
  `📂 <b>${label}</b>\n\n` +
  `<i>${guarantee}</i>\n\n` +
  `──────────────────────────────\n` +
  `📌 Ichki bo'limni tanlang 👇`;

const appPrompt = (sub: string) =>
  `✅ Tanlandi: <b>${sub}</b>\n\n` +
  `──────────────────────────────\n` +
  `📝 <b>Muammoingizni batafsil yozing:</b>\n\n` +
  `<i>Qancha to'liq yozsangiz, shuncha tez javob olasiz.</i>`;

@Update()
@Injectable()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly session: SessionService,
  ) {}

  // ─── /start ────────────────────────────────────────────────────────
  @Start()
  async onStart(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const existing = await this.db.user.findUnique({ where: { telegramId } });

    if (existing) {
      this.session.set(telegramId, { step: 'idle', fullName: existing.fullName, phone: existing.phone });
      await ctx.reply(WELCOME_BACK(existing.fullName), {
        parse_mode: 'HTML',
        ...buildMainMenuInline(),
      });
    } else {
      this.session.reset(telegramId);
      this.session.set(telegramId, { step: 'await_name' });
      await ctx.reply(WELCOME_NEW, { parse_mode: 'HTML' });
    }
  }

  // ─── INLINE: Asosiy menyu — Ariza berish ──────────────────────────
  @Action('menu_apply')
  async onMenuApply(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const s = this.session.get(telegramId);
    await ctx.answerCbQuery();
    if (!s.phone) {
      await ctx.reply('❗ Avval /start orqali ro\'yxatdan o\'ting.');
      return;
    }
    this.session.set(telegramId, { step: 'await_section' });
    await ctx.editMessageText(SECTIONS_MSG, {
      parse_mode: 'HTML',
      ...buildSectionsInlineKeyboard(),
    });
  }

  // ─── INLINE: Asosiy menyu — Admin Login ───────────────────────────
  @Action('menu_admin')
  async onMenuAdmin(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    await ctx.answerCbQuery();
    if (this.session.get(telegramId).isAdmin) {
      await ctx.reply('✅ Siz allaqachon admin paneldasiz.', adminMenuKeyboard);
      return;
    }
    this.session.set(telegramId, { step: 'admin_await_login' });
    await ctx.editMessageText(
      HEADER + `\n\n🔐 <b>Admin Panelga Kirish</b>\n\nLoginni kiriting:`,
      { parse_mode: 'HTML' },
    );
  }

  // ─── INLINE: Bo'lim tanlash ────────────────────────────────────────
  @Action(/^sec_(\d)$/)
  async onSectionSelect(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const secKey = `sec_${ctx.match[1]}`;
    const sec = SECTIONS[secKey];
    if (!sec) return;
    this.session.set(telegramId, {
      step: 'await_subsection',
      selectedSection: sec.label,
      selectedSectionKey: secKey,
    });
    await ctx.answerCbQuery();
    await ctx.editMessageText(subsMsg(sec.label, sec.guarantee), {
      parse_mode: 'HTML',
      ...buildSubSectionsInlineKeyboard(secKey),
    });
  }

  // ─── INLINE: Ichki bo'lim ──────────────────────────────────────────
  @Action(/^sub_(sec_\d)_(\d)$/)
  async onSubSectionSelect(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const secKey = ctx.match[1];
    const subIdx = parseInt(ctx.match[2]);
    const sec = SECTIONS[secKey];
    if (!sec) return;
    const subLabel = sec.subs[subIdx];
    this.session.set(telegramId, { step: 'await_application_text', selectedSubSection: subLabel });
    await ctx.answerCbQuery();
    await ctx.editMessageText(appPrompt(subLabel), { parse_mode: 'HTML' });
    await ctx.reply('✍️ Ariza matnini yozing:', cancelKeyboard);
  }

  // ─── INLINE: Bo'limlarga qaytish ──────────────────────────────────
  @Action('back_to_sections')
  async onBackToSections(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    this.session.set(telegramId, { step: 'await_section' });
    await ctx.answerCbQuery();
    await ctx.editMessageText(SECTIONS_MSG, {
      parse_mode: 'HTML',
      ...buildSectionsInlineKeyboard(),
    });
  }

  // ─── INLINE: Bosh menyuga qaytish ─────────────────────────────────
  @Action('back_to_main')
  async onBackToMain(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const s = this.session.get(telegramId);
    this.session.set(telegramId, { step: 'idle' });
    await ctx.answerCbQuery();
    await ctx.editMessageText(WELCOME_BACK(s.fullName || 'Foydalanuvchi'), {
      parse_mode: 'HTML',
      ...buildMainMenuInline(),
    });
  }

  // ─── INLINE: Admin — Javob yozish ─────────────────────────────────
  @Action(/^reply_(\d+)$/)
  async onReplyAction(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    if (!this.session.get(telegramId).isAdmin) return;
    const appId = parseInt(ctx.match[1]);
    this.session.set(telegramId, { step: 'admin_await_answer', replyToAppId: appId });
    await ctx.answerCbQuery();
    await ctx.reply(
      `✍️ <b>#${appId}</b> raqamli arizaga javobingizni yozing:`,
      { parse_mode: 'HTML', ...cancelKeyboard },
    );
  }

  // ─── REPLY: Barcha Arizalar ────────────────────────────────────────
  @Hears('📋 Barcha Arizalar')
  async onAllApplications(@Ctx() ctx: Context) {
    const telegramId = String(ctx.from!.id);
    if (!this.session.get(telegramId).isAdmin) return;
    const apps = await this.db.application.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    if (!apps.length) { await ctx.reply('📭 Hozircha arizalar yo\'q.'); return; }
    await ctx.reply(`📋 <b>So'nggi ${apps.length} ta ariza:</b>`, { parse_mode: 'HTML' });
    for (const app of apps) {
      const btns = app.status === 'pending'
        ? Markup.inlineKeyboard([[Markup.button.callback(`✍️ #${app.id} ga Javob`, `reply_${app.id}`)]])
        : Markup.inlineKeyboard([]);
      await ctx.reply(this.formatApp(app), { parse_mode: 'HTML', ...btns });
    }
  }

  // ─── REPLY: Kutayotganlar ──────────────────────────────────────────
  @Hears('⏳ Kutayotganlar')
  async onPending(@Ctx() ctx: Context) {
    const telegramId = String(ctx.from!.id);
    if (!this.session.get(telegramId).isAdmin) return;
    const apps = await this.db.application.findMany({
      where: { status: 'pending' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!apps.length) { await ctx.reply('✅ Barcha arizalarga javob berilgan!'); return; }
    await ctx.reply(`⏳ <b>${apps.length} ta ariza kutmoqda:</b>`, { parse_mode: 'HTML' });
    for (const app of apps) {
      const btns = Markup.inlineKeyboard([[Markup.button.callback(`✍️ #${app.id} ga Javob`, `reply_${app.id}`)]]);
      await ctx.reply(this.formatApp(app), { parse_mode: 'HTML', ...btns });
    }
  }

  // ─── REPLY: Chiqish ────────────────────────────────────────────────
  @Hears('🚪 Chiqish')
  async onLogout(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const s = this.session.get(telegramId);
    this.session.set(telegramId, { step: 'idle', isAdmin: false, fullName: s.fullName, phone: s.phone });
    await ctx.reply(
      WELCOME_BACK(s.fullName || 'Foydalanuvchi'),
      { parse_mode: 'HTML', ...buildMainMenuInline() },
    );
  }

  // ─── REPLY: Bekor qilish ───────────────────────────────────────────
  @Hears('❌ Bekor qilish')
  async onCancel(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const s = this.session.get(telegramId);
    this.session.clearAdminState(telegramId);
    if (s.isAdmin) {
      await ctx.reply('❌ Bekor qilindi.', adminMenuKeyboard);
    } else {
      await ctx.reply(
        WELCOME_BACK(s.fullName || 'Foydalanuvchi'),
        { parse_mode: 'HTML', ...buildMainMenuInline() },
      );
    }
  }

  // ─── ON: Contact (telefon tugmasi) ────────────────────────────────
  @On('contact')
  async onContact(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    if (this.session.get(telegramId).step !== 'await_phone') return;
    await this.saveUser(ctx, telegramId, ctx.message.contact.phone_number);
  }

  // ─── ON: Text ──────────────────────────────────────────────────────
  @On('text')
  async onText(@Ctx() ctx: any) {
    const telegramId = String(ctx.from!.id);
    const s = this.session.get(telegramId);
    const text: string = ctx.message.text;

    // Ism-Familiya
    if (s.step === 'await_name') {
      if (text.trim().split(/\s+/).length < 2) {
        await ctx.reply('❗ Iltimos, <b>Ism va Familiya</b>ingizni to\'liq kiriting:\n<i>Masalan: Alisher Valiyev</i>', { parse_mode: 'HTML' });
        return;
      }
      this.session.set(telegramId, { step: 'await_phone', fullName: text.trim() });
      await ctx.reply(
        `✅ Rahmat, <b>${text.trim()}</b>!\n\n` +
        `📱 Telefon raqamingizni yuboring:\n` +
        `<i>Quyidagi tugmani bosing yoki qo'lda kiriting</i>`,
        { parse_mode: 'HTML', ...phoneKeyboard },
      );
      return;
    }

    // Telefon qo'lda
    if (s.step === 'await_phone') {
      const cleaned = text.replace(/\s/g, '');
      if (!/^\+?\d{9,13}$/.test(cleaned)) {
        await ctx.reply('❗ Noto\'g\'ri format. Masalan: <code>+998901234567</code>', { parse_mode: 'HTML' });
        return;
      }
      await this.saveUser(ctx, telegramId, cleaned);
      return;
    }

    // Admin login
    if (s.step === 'admin_await_login') {
      if (text === ADMIN_LOGIN) {
        this.session.set(telegramId, { step: 'admin_await_password' });
        await ctx.reply('🔑 Parolni kiriting:');
      } else {
        await ctx.reply('❌ Login noto\'g\'ri. Qaytadan kiriting:');
      }
      return;
    }

    // Admin parol
    if (s.step === 'admin_await_password') {
      if (text === ADMIN_PASSWORD) {
        this.session.set(telegramId, { step: 'idle', isAdmin: true });
        await ctx.reply(
          `✅ <b>Admin panelga xush kelibsiz!</b>\n\nQanday amal bajarmoqchisiz?`,
          { parse_mode: 'HTML', ...adminMenuKeyboard },
        );
      } else {
        this.session.set(telegramId, { step: 'idle' });
        await ctx.reply(
          `❌ Parol noto'g'ri.\n\n` + WELCOME_BACK(s.fullName || ''),
          { parse_mode: 'HTML', ...buildMainMenuInline() },
        );
      }
      return;
    }

    // Ariza matni
    if (s.step === 'await_application_text') {
      if (text.length < 10) {
        await ctx.reply('❗ Kamida 10 ta belgi kiriting. Batafsil yozing:');
        return;
      }
      await this.submitApplication(ctx, telegramId, text);
      return;
    }

    // Admin javob
    if (s.step === 'admin_await_answer') {
      await this.submitAnswer(ctx, telegramId, text);
      return;
    }
  }

  // ─── Foydalanuvchini saqlash ───────────────────────────────────────
  private async saveUser(ctx: any, telegramId: string, phone: string) {
    const s = this.session.get(telegramId);
    const user = await this.db.user.upsert({
      where: { telegramId },
      update: { phone, fullName: s.fullName! },
      create: { telegramId, fullName: s.fullName!, phone },
    });
    this.session.set(telegramId, { step: 'idle', phone, fullName: user.fullName });
    await ctx.reply(
      `🎉 <b>Ro'yxatdan o'tdingiz!</b>\n\n` +
      `👤 Ism: <b>${user.fullName}</b>\n` +
      `📱 Tel: <code>${phone}</code>`,
      { parse_mode: 'HTML' },
    );
    await ctx.reply(
      WELCOME_BACK(user.fullName),
      { parse_mode: 'HTML', ...buildMainMenuInline() },
    );
  }

  // ─── Ariza yuborish ────────────────────────────────────────────────
  private async submitApplication(ctx: any, telegramId: string, text: string) {
    const s = this.session.get(telegramId);
    const user = await this.db.user.findUnique({ where: { telegramId } });
    if (!user) return;

    const app = await this.db.application.create({
      data: {
        userId: user.id,
        section: s.selectedSection!,
        subSection: s.selectedSubSection!,
        text,
      },
    });

    this.session.set(telegramId, { step: 'idle' });

    await ctx.reply(
      `╔════════════════════════════╗\n` +
      `║  ✅  <b>ARIZA QABUL QILINDI</b>    ║\n` +
      `╚════════════════════════════╝\n\n` +
      `🆔 Ariza raqami: <b>#${app.id}</b>\n` +
      `📂 ${s.selectedSection}\n` +
      `📌 ${s.selectedSubSection}\n\n` +
      `⏳ Mutaxassisimiz tez orada javob beradi.\n` +
      `📬 Javob kelganda sizga xabar yuboriladi.`,
      { parse_mode: 'HTML' },
    );
    await ctx.reply(WELCOME_BACK(user.fullName), {
      parse_mode: 'HTML',
      ...buildMainMenuInline(),
    });

    // Admin ga yuborish
    const dateStr = new Date().toLocaleString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const adminMsg =
      `🆕 <b>YANGI ARIZA #${app.id}</b>\n` +
      `🕐 ${dateStr}\n` +
      `────────────────────────────\n` +
      `📂 ${s.selectedSection}\n` +
      `📌 ${s.selectedSubSection}\n` +
      `────────────────────────────\n` +
      `👤 ${user.fullName}  |  📱 ${user.phone}\n` +
      `🆔 TG: ${telegramId}\n` +
      `────────────────────────────\n` +
      `📝 ${text}`;

    const btn = Markup.inlineKeyboard([[
      Markup.button.callback(`✍️ #${app.id} ga Javob yozish`, `reply_${app.id}`),
    ]]);

    for (const adminId of ADMIN_IDS) {
      try {
        await ctx.telegram.sendMessage(adminId, adminMsg, { parse_mode: 'HTML', ...btn });
      } catch (e) {
        this.logger.error(`Admin ${adminId} xato: ${e.message}`);
      }
    }
  }

  // ─── Admin javobi ──────────────────────────────────────────────────
  private async submitAnswer(ctx: any, telegramId: string, answerText: string) {
    const s = this.session.get(telegramId);
    const appId = s.replyToAppId!;
    const app = await this.db.application.findUnique({ where: { id: appId }, include: { user: true } });

    if (!app) {
      await ctx.reply('❗ Ariza topilmadi.', adminMenuKeyboard);
      this.session.clearAdminState(telegramId);
      return;
    }

    await this.db.application.update({
      where: { id: appId },
      data: { status: 'answered', answer: answerText, answeredAt: new Date() },
    });

    this.session.clearAdminState(telegramId);
    await ctx.reply(
      `✅ <b>Javob #${appId} ga yuborildi!</b>\n👤 ${app.user.fullName}`,
      { parse_mode: 'HTML', ...adminMenuKeyboard },
    );

    try {
      await ctx.telegram.sendMessage(
        app.user.telegramId,
        `╔════════════════════════════╗\n` +
        `║  📬  <b>JAVOB KELDI</b>             ║\n` +
        `╚════════════════════════════╝\n\n` +
        `🆔 Ariza <b>#${appId}</b>\n` +
        `📂 ${app.section}\n` +
        `📌 ${app.subSection}\n` +
        `────────────────────────────\n` +
        `✍️ <b>Javob:</b>\n${answerText}`,
        { parse_mode: 'HTML' },
      );
    } catch (e) {
      this.logger.error(`Foydalanuvchiga javob xato: ${e.message}`);
    }
  }

  // ─── Ariza formatlash ──────────────────────────────────────────────
  private formatApp(app: any): string {
    const d = new Date(app.createdAt).toLocaleString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const status = app.status === 'answered' ? '✅ Javob berilgan' : '⏳ Kutmoqda';
    let t =
      `📄 <b>Ariza #${app.id}</b> — ${status}\n🕐 ${d}\n` +
      `────────────────────────────\n` +
      `📂 ${app.section}\n📌 ${app.subSection}\n` +
      `────────────────────────────\n` +
      `👤 ${app.user.fullName}  |  📱 ${app.user.phone}\n` +
      `────────────────────────────\n📝 ${app.text}`;
    if (app.answer) t += `\n\n✍️ <b>Javob:</b>\n${app.answer}`;
    return t;
  }
}
