import type { ExtensionEventMessage, ExtensionEventVersionMessage, ExtensionRequestMetadataMessage, ExtensionNotaryProofRequest, PaymentPlatformType } from '../types';

export enum ExtensionPostMessage {
  OPEN_NEW_TAB = 'open_new_tab',
  FETCH_EXTENSION_VERSION = 'fetch_extension_version',
  FETCH_PROOF_BY_ID = 'fetch_proof_by_id',
  GENERATE_PROOF = 'generate_proof',
}

export enum ExtensionReceiveMessage {
  EXTENSION_VERSION_RESPONSE = 'extension_version_response',
  METADATA_MESSAGES_RESPONSE = 'metadata_messages_response',
  FETCH_PROOF_BY_ID_RESPONSE = 'fetch_proof_by_id_response',
  FETCH_PROOF_REQUEST_ID_RESPONSE = 'fetch_proof_request_id_response',
}

type Callbacks = {
  onVersion?: (version: string | null) => void;
  onMetadata?: (platform: PaymentPlatformType, payload: { metadata: any[]; expiresAt: number }) => void;
  onProofId?: (proofId: string | null) => void;
  onProof?: (proof: ExtensionNotaryProofRequest | null) => void;
  onError?: (error: Error) => void;
};

export class PeerauthExtension {
  private _version: string | null = null;
  private _proofId: string | null = null;
  private _callbacks: Callbacks;

  constructor(callbacks: Callbacks = {}) {
    this._callbacks = callbacks;
    if (this.isBrowser()) {
      window.addEventListener('message', this._handleMessage);
    }
  }

  dispose() {
    if (this.isBrowser()) {
      window.removeEventListener('message', this._handleMessage);
    }
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.postMessage === 'function';
  }

  fetchVersion() {
    if (!this.isBrowser()) return;
    window.postMessage({ type: ExtensionPostMessage.FETCH_EXTENSION_VERSION }, '*');
  }

  isInstalled(): boolean {
    return !!this._version;
  }

  getVersion(): string | null {
    return this._version;
  }

  openNewTab(actionType: string, platform: string) {
    if (!this.isBrowser()) return;
    window.postMessage({ type: ExtensionPostMessage.OPEN_NEW_TAB, actionType, platform }, '*');
  }

  generateProof(platform: PaymentPlatformType, intentHash: string, originalIndex: number, proofIndex?: number) {
    if (!this.isBrowser()) return;
    this._proofId = null;
    window.postMessage({
      type: ExtensionPostMessage.GENERATE_PROOF,
      platform,
      intentHash,
      originalIndex,
      proofIndex,
    }, '*');
  }

  fetchProofById() {
    if (!this.isBrowser() || !this._proofId) return;
    window.postMessage({ type: ExtensionPostMessage.FETCH_PROOF_BY_ID, proofId: this._proofId }, '*');
  }

  private _handleMessage = (event: MessageEvent) => {
    try {
      if (!this.isBrowser()) return;
      if (event.origin !== window.location.origin) return;
      const data: any = (event as any).data || {};
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case ExtensionReceiveMessage.EXTENSION_VERSION_RESPONSE:
          this._onVersion(event as unknown as ExtensionEventVersionMessage);
          break;
        case ExtensionReceiveMessage.METADATA_MESSAGES_RESPONSE:
          this._onMetadata(event as unknown as ExtensionRequestMetadataMessage);
          break;
        case ExtensionReceiveMessage.FETCH_PROOF_REQUEST_ID_RESPONSE:
          this._onProofId(event as unknown as ExtensionEventMessage);
          break;
        case ExtensionReceiveMessage.FETCH_PROOF_BY_ID_RESPONSE:
          this._onProof(event as unknown as ExtensionEventMessage);
          break;
        default:
          break;
      }
    } catch (e) {
      this._callbacks.onError?.(e as Error);
    }
  };

  private _onVersion(event: ExtensionEventVersionMessage) {
    const version = event.data?.version ?? null;
    this._version = version;
    this._callbacks.onVersion?.(version);
  }

  private _onMetadata(event: ExtensionRequestMetadataMessage) {
    const platform = event.data?.platform as PaymentPlatformType;
    const payload = { metadata: event.data?.metadata ?? [], expiresAt: event.data?.expiresAt ?? 0 };
    this._callbacks.onMetadata?.(platform, payload);
  }

  private _onProofId(event: ExtensionEventMessage) {
    const id = event.data?.proofId ?? null;
    this._proofId = id || null;
    this._callbacks.onProofId?.(this._proofId);
  }

  private _onProof(event: ExtensionEventMessage) {
    const history = event.data?.requestHistory as
      | { notaryRequest?: ExtensionNotaryProofRequest; notaryRequests?: ExtensionNotaryProofRequest[] }
      | undefined;
    const req = history?.notaryRequest ?? (history?.notaryRequests && history.notaryRequests[0]) ?? undefined;
    this._callbacks.onProof?.(req ?? null);
  }
}
