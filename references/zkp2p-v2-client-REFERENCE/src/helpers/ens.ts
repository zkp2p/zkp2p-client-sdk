import { mainnetPublicClient } from "./mainnetClient";

export async function resolveEnsName(ensName: string): Promise<string | null> {
  try {
    const address = await mainnetPublicClient.getEnsAddress({
      name: ensName,
    });
    if (!address) {
      return null;
    }
    return address;
  } catch (error) {
    return null;
  }
};
