import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto.js';
import {
  PAYMENT_SETTINGS_ID,
  PaymentSettings,
  PaymentSettingsDocument,
} from './schemas/payment-settings.schema.js';

export type SettingSource = 'dashboard' | 'environment';

export interface EffectivePaymentSettings {
  readonly guestCheckoutEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly sources: {
    readonly guestCheckoutEnabled: SettingSource;
    readonly emailEnabled: SettingSource;
  };
  readonly updatedAt: Date | null;
}

@Injectable()
export class PaymentSettingsService {
  constructor(
    @InjectModel(PaymentSettings.name)
    private readonly settingsModel: Model<PaymentSettingsDocument>,
    private readonly configService: ConfigService,
  ) {}

  /** Dashboard overrides win; anything not overridden falls back to the environment. */
  async getEffective(): Promise<EffectivePaymentSettings> {
    const stored = await this.settingsModel.findById(PAYMENT_SETTINGS_ID).lean().exec();
    const envGuest = this.configService.get<boolean>('payments.guestCheckoutEnabled') === true;
    const envEmail = this.configService.get<boolean>('payments.emailEnabled') === true;
    return {
      guestCheckoutEnabled: stored?.guestCheckoutEnabled ?? envGuest,
      emailEnabled: stored?.emailEnabled ?? envEmail,
      sources: {
        guestCheckoutEnabled: stored?.guestCheckoutEnabled === undefined ? 'environment' : 'dashboard',
        emailEnabled: stored?.emailEnabled === undefined ? 'environment' : 'dashboard',
      },
      updatedAt: stored?.updatedAt ?? null,
    };
  }

  async update(dto: UpdatePaymentSettingsDto): Promise<EffectivePaymentSettings> {
    const set: Record<string, boolean> = {};
    const unset: Record<string, ''> = {};
    for (const key of ['guestCheckoutEnabled', 'emailEnabled'] as const) {
      const value = dto[key];
      if (typeof value === 'boolean') {
        set[key] = value;
      } else if (value === null) {
        unset[key] = '';
      }
    }
    if (Object.keys(set).length > 0 || Object.keys(unset).length > 0) {
      await this.settingsModel
        .updateOne(
          { _id: PAYMENT_SETTINGS_ID },
          {
            ...(Object.keys(set).length > 0 ? { $set: set } : {}),
            ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
          },
          { upsert: true },
        )
        .exec();
    }
    return this.getEffective();
  }
}
