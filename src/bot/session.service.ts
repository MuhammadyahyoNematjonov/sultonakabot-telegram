import { Injectable } from '@nestjs/common';

export type UserStep =
  | 'idle'
  | 'await_name'
  | 'await_phone'
  | 'await_section'
  | 'await_subsection'
  | 'await_application_text'
  | 'admin_await_login'
  | 'admin_await_password'
  | 'admin_await_answer';

export interface UserSession {
  step: UserStep;
  fullName?: string;
  phone?: string;
  selectedSection?: string;
  selectedSectionKey?: string;
  selectedSubSection?: string;
  isAdmin?: boolean;
  replyToAppId?: number; // admin javob yozayotganda
}

@Injectable()
export class SessionService {
  private sessions = new Map<string, UserSession>();

  get(telegramId: string): UserSession {
    if (!this.sessions.has(telegramId)) {
      this.sessions.set(telegramId, { step: 'idle' });
    }
    return this.sessions.get(telegramId)!;
  }

  set(telegramId: string, data: Partial<UserSession>) {
    const current = this.get(telegramId);
    this.sessions.set(telegramId, { ...current, ...data });
  }

  reset(telegramId: string) {
    this.sessions.set(telegramId, { step: 'idle' });
  }

  clearAdminState(telegramId: string) {
    const s = this.get(telegramId);
    this.sessions.set(telegramId, {
      step: 'idle',
      isAdmin: s.isAdmin,
      fullName: s.fullName,
      phone: s.phone,
    });
  }
}
