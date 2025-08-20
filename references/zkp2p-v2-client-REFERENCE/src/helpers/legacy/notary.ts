export const NOTARY_VERIFICATION_SIGNING_KEY = import.meta.env.VITE_NOTARY_VERIFICATION_SIGNING_KEY;
if (!NOTARY_VERIFICATION_SIGNING_KEY) {
    throw new Error("NOTARY_VERIFICATION_SIGNING_KEY environment variable is not defined.");
};
