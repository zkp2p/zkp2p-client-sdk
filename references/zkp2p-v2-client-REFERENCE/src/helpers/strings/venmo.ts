import { PlatformStrings } from './platform';

const strings: PlatformStrings = {
  // Proof Form
  PROOF_FORM_TITLE_REGISTRATION_INSTRUCTIONS: `
    Provide a historical transaction email sent from Venmo containing "You paid" in the subject received after
    January 10th, 2024 to complete registration.
  `,

  // Mail Instructions
  SIGN_IN_WITH_GOOGLE_INSTRUCTIONS: `
    Sign in with Google to pull in your Venmo transaction emails. The emails are not stored and never
    leave your browser. Read more:
  `,
  NO_EMAILS_ERROR: `
    No emails found.
    Please ensure you are using an email attached to a Venmo account with a receipt after 1/10/24.
  `,

  // Notarizations Instructions
  NO_NOTARIZATIONS_ERROR: `
    no-op
  `,
  NO_TRANSFER_NOTARIZATIONS_ERROR: `
    Lorem ipsum
  `,

  // New Registration
  REGISTRATION_INSTRUCTIONS: `
    You must register in order to use ZKP2P. Registration requires a confirmation email from Venmo
    with subject "You paid", which is used to prove you own a Venmo account. Your Venmo ID is
    hashed to conceal your identity.
  `,

  // On Ramp Instructions
  PROOF_FORM_TITLE_SEND_INSTRUCTIONS: `
    Provide the transaction email containing "You paid" to complete the order. You can sign in with
    Google to pull the emails or paste the contents directly.
  `,


  // Instruction Drawer
  INSTRUCTION_DRAWER_STEP_ONE: `
    Enter USDC amount to receive to get a quote. You are assigned the best available rate for the requested amount
  `,
  INSTRUCTION_DRAWER_STEP_TWO: `
    Submit transaction to start your order. Optionally, provide a recipient address below to receive funds in another wallet
  `,
  INSTRUCTION_DRAWER_STEP_THREE: `
    Click 'Send' and complete the payment on Venmo. Ensure you have email notifications from Venmo enabled
  `,
  INSTRUCTION_DRAWER_STEP_FOUR: `
    Continue through to validate email proof of transaction. Submit proof to receive the requested USDC
  `,

  // Payment Requirements
  PAYMENT_REQUIREMENT_STEP_ONE: `
    Email notifications are enabled in your Venmo notifications settings
  `,
  PAYMENT_REQUIREMENT_STEP_TWO: `
    Amount USD sent, which may differ from the requested USDC amount, is correct
  `,
  PAYMENT_REQUIREMENT_STEP_THREE: `
    Payment note does not contain emojis
  `,
  PAYMENT_REQUIREMENT_STEP_FOUR: `
    'Turn on for purchases' at the payment screen is toggled off
  `,
};

export default strings;
