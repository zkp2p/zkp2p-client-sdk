import { PaymentPlatform, PaymentPlatformType } from '@helpers/types';

import venmoCopy from './venmo';

// Platform strings
export interface PlatformStrings {
  // Proof Form
  PROOF_FORM_TITLE_REGISTRATION_INSTRUCTIONS: string,

  // Mail Instructions
  SIGN_IN_WITH_GOOGLE_INSTRUCTIONS: string,
  NO_EMAILS_ERROR: string

  // Notarizations Instructions
  NO_NOTARIZATIONS_ERROR: string,
  NO_TRANSFER_NOTARIZATIONS_ERROR: string,

  // New Registration
  REGISTRATION_INSTRUCTIONS: string,

  // On Ramp Instructions
  PROOF_FORM_TITLE_SEND_INSTRUCTIONS: string,

  // Instruction Drawer
  INSTRUCTION_DRAWER_STEP_ONE: string,
  INSTRUCTION_DRAWER_STEP_TWO: string,
  INSTRUCTION_DRAWER_STEP_THREE: string,
  INSTRUCTION_DRAWER_STEP_FOUR: string,

  // Payment Requirements
  PAYMENT_REQUIREMENT_STEP_ONE: string,
  PAYMENT_REQUIREMENT_STEP_TWO: string,
  PAYMENT_REQUIREMENT_STEP_THREE: string,
  PAYMENT_REQUIREMENT_STEP_FOUR: string,
}

export class PlatformStringProvider {
  private strings: PlatformStrings;

  constructor(platformType: PaymentPlatformType) {
    if (platformType === PaymentPlatform.VENMO) {
      this.strings = venmoCopy;
    } else {
      throw new Error('Invalid platform type');
    }
  }

  get(key: keyof PlatformStrings): string {
    if (!this.strings[key]) throw new Error(`Invalid key: ${key}`);
    return this.strings[key] ?? '';
  }

  static getForPlatform(platformType: PaymentPlatformType, key: keyof PlatformStrings): string {
    let strings: PlatformStrings;
    if (platformType === PaymentPlatform.VENMO) {
      strings = venmoCopy;
    } else {
      strings = venmoCopy;      // todo: fix this later
    }
    return strings[key] ?? '';
  }
};
