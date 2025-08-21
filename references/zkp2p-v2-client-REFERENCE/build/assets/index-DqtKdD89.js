import{i as re,a as ae,x as w}from"./lit-element-CRwiKRQV.js";import{o as B,r as N}from"./class-map-E4R2Eani.js";import{z as pe,O as me,P as M,h as K,f as I,d as C,b as S,D as fe,E as b,S as R,A as _,R as Z,M as D,T as we,n as ee,o as he}from"./index-Bcpr83TD.js";import{c as ie}from"./index-Cbrxnqo_.js";import"./index-nJjjYhNz.js";import"./index-CVKg3HZ8.js";import"./index-B3IvwMRw.js";import"./index-BjPBTjwE.js";import"./index-D7ihiz_-.js";import"./index-DyORczfQ.js";import"./index-B3qd0BZY.js";import"./index-BCkg-yGF.js";import"./index-CLls0W8x.js";import"./index-EEwC5m0l.js";const z={},j=e=>typeof e=="object"&&e!==null,ye=e=>j(e)&&!q.has(e)&&(Array.isArray(e)||!(Symbol.iterator in e))&&!(e instanceof WeakMap)&&!(e instanceof WeakSet)&&!(e instanceof Error)&&!(e instanceof Number)&&!(e instanceof Date)&&!(e instanceof String)&&!(e instanceof RegExp)&&!(e instanceof ArrayBuffer)&&!(e instanceof Promise),ge=(e,t,s,r)=>({deleteProperty(i,a){const o=Reflect.get(i,a);s(a);const d=Reflect.deleteProperty(i,a);return d&&r(["delete",[a],o]),d},set(i,a,o,d){const h=!e()&&Reflect.has(i,a),g=Reflect.get(i,a,d);if(h&&(te(g,o)||G.has(o)&&te(g,G.get(o))))return!0;s(a),j(o)&&(o=pe(o)||o);const x=!V.has(o)&&Ie(o)?X(o):o;return t(a,x),Reflect.set(i,a,x,d),r(["set",[a],o,g]),!0}}),V=new WeakMap,q=new WeakSet,L=[1,1],G=new WeakMap;let te=Object.is,Ee=(e,t)=>new Proxy(e,t),Ie=ye,Ae=ge;function X(e={}){if(!j(e))throw new Error("object required");const t=G.get(e);if(t)return t;let s=L[0];const r=new Set,i=(p,f=++L[0])=>{s!==f&&(s=f,r.forEach(m=>m(p,f)))};let a=L[1];const o=(p=++L[1])=>(a!==p&&!r.size&&(a=p,h.forEach(([f])=>{const m=f[1](p);m>s&&(s=m)})),s),d=p=>(f,m)=>{const E=[...f];E[1]=[p,...E[1]],i(E,m)},h=new Map,g=(p,f)=>{const m=!q.has(f)&&V.get(f);if(m){if((z?"production":void 0)!=="production"&&h.has(p))throw new Error("prop listener already exists");if(r.size){const E=m[2](d(p));h.set(p,[m,E])}else h.set(p,[m])}},x=p=>{var f;const m=h.get(p);m&&(h.delete(p),(f=m[1])==null||f.call(m))},ce=p=>(r.add(p),r.size===1&&h.forEach(([m,E],U)=>{if((z?"production":void 0)!=="production"&&E)throw new Error("remove already exists");const de=m[2](d(U));h.set(U,[m,de])}),()=>{r.delete(p),r.size===0&&h.forEach(([m,E],U)=>{E&&(E(),h.set(U,[m]))})});let Q=!0;const ue=Ae(()=>Q,g,x,i),k=Ee(e,ue);G.set(e,k);const le=[e,o,ce];return V.set(k,le),Reflect.ownKeys(e).forEach(p=>{const f=Object.getOwnPropertyDescriptor(e,p);"value"in f&&f.writable&&(k[p]=e[p])}),Q=!1,k}function Y(e,t,s){const r=V.get(e);(z?"production":void 0)!=="production"&&!r&&console.warn("Please use proxy object");let i;const a=[],o=r[2];let d=!1;const g=o(x=>{a.push(x),i||(i=Promise.resolve().then(()=>{i=void 0,d&&t(a.splice(0))}))});return d=!0,()=>{d=!1,g()}}function Ne(e){return q.add(e),e}function oe(e,t,s,r){let i=e[t];return Y(e,()=>{const a=e[t];Object.is(i,a)||s(i=a)})}const $={eip155:void 0,solana:void 0,polkadot:void 0,bip122:void 0,cosmos:void 0},y=X({providers:{...$},providerIds:{...$}}),O={state:y,subscribeKey(e,t){return oe(y,e,t)},subscribe(e){return Y(y,()=>{e(y)})},subscribeProviders(e){return Y(y.providers,()=>e(y.providers))},setProvider(e,t){e&&t&&(y.providers[e]=Ne(t))},getProvider(e){if(e)return y.providers[e]},setProviderId(e,t){t&&(y.providerIds[e]=t)},getProviderId(e){if(e)return y.providerIds[e]},reset(){y.providers={...$},y.providerIds={...$}},resetChain(e){y.providers[e]=void 0,y.providerIds[e]=void 0}},c={INVALID_PAYMENT_CONFIG:"INVALID_PAYMENT_CONFIG",INVALID_RECIPIENT:"INVALID_RECIPIENT",INVALID_ASSET:"INVALID_ASSET",INVALID_AMOUNT:"INVALID_AMOUNT",UNKNOWN_ERROR:"UNKNOWN_ERROR",UNABLE_TO_INITIATE_PAYMENT:"UNABLE_TO_INITIATE_PAYMENT",INVALID_CHAIN_NAMESPACE:"INVALID_CHAIN_NAMESPACE",GENERIC_PAYMENT_ERROR:"GENERIC_PAYMENT_ERROR",UNABLE_TO_GET_EXCHANGES:"UNABLE_TO_GET_EXCHANGES",ASSET_NOT_SUPPORTED:"ASSET_NOT_SUPPORTED",UNABLE_TO_GET_PAY_URL:"UNABLE_TO_GET_PAY_URL",UNABLE_TO_GET_BUY_STATUS:"UNABLE_TO_GET_BUY_STATUS"},T={[c.INVALID_PAYMENT_CONFIG]:"Invalid payment configuration",[c.INVALID_RECIPIENT]:"Invalid recipient address",[c.INVALID_ASSET]:"Invalid asset specified",[c.INVALID_AMOUNT]:"Invalid payment amount",[c.UNKNOWN_ERROR]:"Unknown payment error occurred",[c.UNABLE_TO_INITIATE_PAYMENT]:"Unable to initiate payment",[c.INVALID_CHAIN_NAMESPACE]:"Invalid chain namespace",[c.GENERIC_PAYMENT_ERROR]:"Unable to process payment",[c.UNABLE_TO_GET_EXCHANGES]:"Unable to get exchanges",[c.ASSET_NOT_SUPPORTED]:"Asset not supported by the selected exchange",[c.UNABLE_TO_GET_PAY_URL]:"Unable to get payment URL",[c.UNABLE_TO_GET_BUY_STATUS]:"Unable to get buy status"};class u extends Error{get message(){return T[this.code]}constructor(t,s){super(T[t]),this.name="AppKitPayError",this.code=t,this.details=s,Error.captureStackTrace&&Error.captureStackTrace(this,u)}}const Pe="https://rpc.walletconnect.org/v1/json-rpc";class _e extends Error{}function Se(){const e=me.getSnapshot().projectId;return`${Pe}?projectId=${e}`}async function J(e,t){const s=Se(),a=await(await fetch(s,{method:"POST",body:JSON.stringify({jsonrpc:"2.0",id:1,method:e,params:t}),headers:{"Content-Type":"application/json"}})).json();if(a.error)throw new _e(a.error.message);return a}async function ne(e){return(await J("reown_getExchanges",e)).result}async function xe(e){return(await J("reown_getExchangePayUrl",e)).result}async function Te(e){return(await J("reown_getExchangeBuyStatus",e)).result}const Ce=["eip155","solana"],ve={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function H(e,t){const{chainNamespace:s,chainId:r}=M.parseCaipNetworkId(e),i=ve[s];if(!i)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${s}`);let a=i.native.assetNamespace,o=i.native.assetReference;return t!=="native"&&(a=i.defaultTokenNamespace,o=t),`${`${s}:${r}`}/${a}:${o}`}function be(e){const{chainNamespace:t}=M.parseCaipNetworkId(e);return Ce.includes(t)}async function Re(e){const{paymentAssetNetwork:t,activeCaipNetwork:s,approvedCaipNetworkIds:r,requestedCaipNetworks:i}=e,o=K.sortRequestedNetworks(r,i).find(g=>g.caipNetworkId===t);if(!o)throw new u(c.INVALID_PAYMENT_CONFIG);if(o.caipNetworkId===s.caipNetworkId)return;const d=I.getNetworkProp("supportsAllNetworks",o.chainNamespace);if(!(r?.includes(o.caipNetworkId)||d))throw new u(c.INVALID_PAYMENT_CONFIG);try{await I.switchActiveNetwork(o)}catch(g){throw new u(c.GENERIC_PAYMENT_ERROR,g)}}async function ke(e,t,s){if(t!==C.CHAIN.EVM)throw new u(c.INVALID_CHAIN_NAMESPACE);if(!s.fromAddress)throw new u(c.INVALID_PAYMENT_CONFIG,"fromAddress is required for native EVM payments.");const r=typeof s.amount=="string"?parseFloat(s.amount):s.amount;if(isNaN(r))throw new u(c.INVALID_PAYMENT_CONFIG);const i=e.metadata?.decimals??18,a=S.parseUnits(r.toString(),i);if(typeof a!="bigint")throw new u(c.GENERIC_PAYMENT_ERROR);return await S.sendTransaction({chainNamespace:t,to:s.recipient,address:s.fromAddress,value:a,data:"0x"})??void 0}async function Ue(e,t){if(!t.fromAddress)throw new u(c.INVALID_PAYMENT_CONFIG,"fromAddress is required for ERC20 EVM payments.");const s=e.asset,r=t.recipient,i=Number(e.metadata.decimals),a=S.parseUnits(t.amount.toString(),i);if(a===void 0)throw new u(c.GENERIC_PAYMENT_ERROR);return await S.writeContract({fromAddress:t.fromAddress,tokenAddress:s,args:[r,a],method:"transfer",abi:fe.getERC20Abi(s),chainNamespace:C.CHAIN.EVM})??void 0}async function Le(e,t){if(e!==C.CHAIN.SOLANA)throw new u(c.INVALID_CHAIN_NAMESPACE);if(!t.fromAddress)throw new u(c.INVALID_PAYMENT_CONFIG,"fromAddress is required for Solana payments.");const s=typeof t.amount=="string"?parseFloat(t.amount):t.amount;if(isNaN(s)||s<=0)throw new u(c.INVALID_PAYMENT_CONFIG,"Invalid payment amount.");try{if(!O.getProvider(e))throw new u(c.GENERIC_PAYMENT_ERROR,"No Solana provider available.");const i=await S.sendTransaction({chainNamespace:C.CHAIN.SOLANA,to:t.recipient,value:s,tokenMint:t.tokenMint});if(!i)throw new u(c.GENERIC_PAYMENT_ERROR,"Transaction failed.");return i}catch(r){throw r instanceof u?r:new u(c.GENERIC_PAYMENT_ERROR,`Solana payment failed: ${r}`)}}const se=0,F="unknown",n=X({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0}),l={state:n,subscribe(e){return Y(n,()=>e(n))},subscribeKey(e,t){return oe(n,e,t)},async handleOpenPay(e){this.resetState(),this.setPaymentConfig(e),this.subscribeEvents(),this.initializeAnalytics(),n.isConfigured=!0,b.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:n.exchanges,configuration:{network:n.paymentAsset.network,asset:n.paymentAsset.asset,recipient:n.recipient,amount:n.amount}}}),await D.open({view:"Pay"})},resetState(){n.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},n.recipient="0x0",n.amount=0,n.isConfigured=!1,n.error=null,n.isPaymentInProgress=!1,n.isLoading=!1,n.currentPayment=void 0},setPaymentConfig(e){if(!e.paymentAsset)throw new u(c.INVALID_PAYMENT_CONFIG);try{n.paymentAsset=e.paymentAsset,n.recipient=e.recipient,n.amount=e.amount,n.openInNewTab=e.openInNewTab??!0,n.redirectUrl=e.redirectUrl,n.payWithExchange=e.payWithExchange,n.error=null}catch(t){throw new u(c.INVALID_PAYMENT_CONFIG,t.message)}},getPaymentAsset(){return n.paymentAsset},getExchanges(){return n.exchanges},async fetchExchanges(){try{n.isLoading=!0;const e=await ne({page:se,asset:H(n.paymentAsset.network,n.paymentAsset.asset),amount:n.amount.toString()});n.exchanges=e.exchanges.slice(0,2)}catch{throw R.showError(T.UNABLE_TO_GET_EXCHANGES),new u(c.UNABLE_TO_GET_EXCHANGES)}finally{n.isLoading=!1}},async getAvailableExchanges(e){try{const t=e?.asset&&e?.network?H(e.network,e.asset):void 0;return await ne({page:e?.page??se,asset:t,amount:e?.amount?.toString()})}catch{throw new u(c.UNABLE_TO_GET_EXCHANGES)}},async getPayUrl(e,t,s=!1){try{const r=Number(t.amount),i=await xe({exchangeId:e,asset:H(t.network,t.asset),amount:r.toString(),recipient:`${t.network}:${t.recipient}`});return b.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{exchange:{id:e},configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:r},currentPayment:{type:"exchange",exchangeId:e},headless:s}}),s&&(this.initiatePayment(),b.sendEvent({type:"track",event:"PAY_INITIATED",properties:{paymentId:n.paymentId||F,configuration:{network:t.network,asset:t.asset,recipient:t.recipient,amount:r},currentPayment:{type:"exchange",exchangeId:e}}})),i}catch(r){throw r instanceof Error&&r.message.includes("is not supported")?new u(c.ASSET_NOT_SUPPORTED):new Error(r.message)}},async openPayUrl(e,t,s=!1){try{const r=await this.getPayUrl(e.exchangeId,t,s);if(!r)throw new u(c.UNABLE_TO_GET_PAY_URL);const a=e.openInNewTab??!0?"_blank":"_self";return K.openHref(r.url,a),r}catch(r){throw r instanceof u?n.error=r.message:n.error=T.GENERIC_PAYMENT_ERROR,new u(c.UNABLE_TO_GET_PAY_URL)}},subscribeEvents(){n.isConfigured||(O.subscribeProviders(async e=>{O.getProvider(I.state.activeChain)&&await this.handlePayment()}),_.subscribeKey("caipAddress",async e=>{e&&await this.handlePayment()}))},async handlePayment(){n.currentPayment={type:"wallet",status:"IN_PROGRESS"};const e=_.state.caipAddress;if(!e)return;const{chainId:t,address:s}=M.parseCaipAddress(e),r=I.state.activeChain;if(!s||!t||!r||!O.getProvider(r))return;const a=I.state.activeCaipNetwork;if(a&&!n.isPaymentInProgress)try{this.initiatePayment();const o=I.getAllRequestedCaipNetworks(),d=I.getAllApprovedCaipNetworkIds();switch(await Re({paymentAssetNetwork:n.paymentAsset.network,activeCaipNetwork:a,approvedCaipNetworkIds:d,requestedCaipNetworks:o}),await D.open({view:"PayLoading"}),r){case C.CHAIN.EVM:n.paymentAsset.asset==="native"&&(n.currentPayment.result=await ke(n.paymentAsset,r,{recipient:n.recipient,amount:n.amount,fromAddress:s})),n.paymentAsset.asset.startsWith("0x")&&(n.currentPayment.result=await Ue(n.paymentAsset,{recipient:n.recipient,amount:n.amount,fromAddress:s})),n.currentPayment.status="SUCCESS";break;case C.CHAIN.SOLANA:n.currentPayment.result=await Le(r,{recipient:n.recipient,amount:n.amount,fromAddress:s,tokenMint:n.paymentAsset.asset==="native"?void 0:n.paymentAsset.asset}),n.currentPayment.status="SUCCESS";break;default:throw new u(c.INVALID_CHAIN_NAMESPACE)}}catch(o){o instanceof u?n.error=o.message:n.error=T.GENERIC_PAYMENT_ERROR,n.currentPayment.status="FAILED",R.showError(n.error)}finally{n.isPaymentInProgress=!1}},getExchangeById(e){return n.exchanges.find(t=>t.id===e)},validatePayConfig(e){const{paymentAsset:t,recipient:s,amount:r}=e;if(!t)throw new u(c.INVALID_PAYMENT_CONFIG);if(!s)throw new u(c.INVALID_RECIPIENT);if(!t.asset)throw new u(c.INVALID_ASSET);if(r==null||r<=0)throw new u(c.INVALID_AMOUNT)},handlePayWithWallet(){const e=_.state.caipAddress;if(!e){Z.push("Connect");return}const{chainId:t,address:s}=M.parseCaipAddress(e),r=I.state.activeChain;if(!s||!t||!r){Z.push("Connect");return}this.handlePayment()},async handlePayWithExchange(e){try{n.currentPayment={type:"exchange",exchangeId:e};const{network:t,asset:s}=n.paymentAsset,r={network:t,asset:s,amount:n.amount,recipient:n.recipient},i=await this.getPayUrl(e,r);if(!i)throw new u(c.UNABLE_TO_INITIATE_PAYMENT);return n.currentPayment.sessionId=i.sessionId,n.currentPayment.status="IN_PROGRESS",n.currentPayment.exchangeId=e,this.initiatePayment(),{url:i.url,openInNewTab:n.openInNewTab}}catch(t){return t instanceof u?n.error=t.message:n.error=T.GENERIC_PAYMENT_ERROR,n.isPaymentInProgress=!1,R.showError(n.error),null}},async getBuyStatus(e,t){try{const s=await Te({sessionId:t,exchangeId:e});return(s.status==="SUCCESS"||s.status==="FAILED")&&b.sendEvent({type:"track",event:s.status==="SUCCESS"?"PAY_SUCCESS":"PAY_ERROR",properties:{paymentId:n.paymentId||F,configuration:{network:n.paymentAsset.network,asset:n.paymentAsset.asset,recipient:n.recipient,amount:n.amount},currentPayment:{type:"exchange",exchangeId:n.currentPayment?.exchangeId,sessionId:n.currentPayment?.sessionId,result:s.txHash}}}),s}catch{throw new u(c.UNABLE_TO_GET_BUY_STATUS)}},async updateBuyStatus(e,t){try{const s=await this.getBuyStatus(e,t);n.currentPayment&&(n.currentPayment.status=s.status,n.currentPayment.result=s.txHash),(s.status==="SUCCESS"||s.status==="FAILED")&&(n.isPaymentInProgress=!1)}catch{throw new u(c.UNABLE_TO_GET_BUY_STATUS)}},initiatePayment(){n.isPaymentInProgress=!0,n.paymentId=crypto.randomUUID()},initializeAnalytics(){n.analyticsSet||(n.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",e=>{if(n.currentPayment?.status&&n.currentPayment.status!=="UNKNOWN"){const t={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[n.currentPayment.status];b.sendEvent({type:"track",event:t,properties:{paymentId:n.paymentId||F,configuration:{network:n.paymentAsset.network,asset:n.paymentAsset.asset,recipient:n.recipient,amount:n.amount},currentPayment:{type:n.currentPayment.type,exchangeId:n.currentPayment.exchangeId,sessionId:n.currentPayment.sessionId,result:n.currentPayment.result}}})}}))}},Oe=re`
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }

  .token-display {
    padding: var(--wui-spacing-s) var(--wui-spacing-m);
    border-radius: var(--wui-border-radius-s);
    background-color: var(--wui-color-bg-125);
    margin-top: var(--wui-spacing-s);
    margin-bottom: var(--wui-spacing-s);
  }

  .token-display wui-text {
    text-transform: none;
  }

  wui-loading-spinner {
    padding: var(--wui-spacing-xs);
  }
`;var P=function(e,t,s,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,s):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(e,t,s,r);else for(var d=e.length-1;d>=0;d--)(o=e[d])&&(a=(i<3?o(a):i>3?o(t,s,a):o(t,s))||a);return i>3&&a&&Object.defineProperty(t,s,a),a};let A=class extends ae{constructor(){super(),this.unsubscribe=[],this.amount="",this.tokenSymbol="",this.networkName="",this.exchanges=l.state.exchanges,this.isLoading=l.state.isLoading,this.loadingExchangeId=null,this.connectedWalletInfo=_.state.connectedWalletInfo,this.initializePaymentDetails(),this.unsubscribe.push(l.subscribeKey("exchanges",t=>this.exchanges=t)),this.unsubscribe.push(l.subscribeKey("isLoading",t=>this.isLoading=t)),this.unsubscribe.push(_.subscribe(t=>this.connectedWalletInfo=t.connectedWalletInfo)),l.fetchExchanges()}get isWalletConnected(){return _.state.status==="connected"}render(){return w`
      <wui-flex flexDirection="column">
        <wui-flex flexDirection="column" .padding=${["0","l","l","l"]} gap="s">
          ${this.renderPaymentHeader()}

          <wui-flex flexDirection="column" gap="s">
            ${this.renderPayWithWallet()} ${this.renderExchangeOptions()}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}initializePaymentDetails(){const t=l.getPaymentAsset();this.networkName=t.network,this.tokenSymbol=t.metadata.symbol,this.amount=l.state.amount.toString()}renderPayWithWallet(){return be(this.networkName)?w`<wui-flex flexDirection="column" gap="s">
        ${this.isWalletConnected?this.renderConnectedView():this.renderDisconnectedView()}
      </wui-flex>
      <wui-separator text="or"></wui-separator>`:w``}renderPaymentHeader(){let t=this.networkName;if(this.networkName){const r=I.getAllRequestedCaipNetworks().find(i=>i.caipNetworkId===this.networkName);r&&(t=r.name)}return w`
      <wui-flex flexDirection="column" alignItems="center">
        <wui-flex alignItems="center" gap="xs">
          <wui-text variant="large-700" color="fg-100">${this.amount||"0.0000"}</wui-text>
          <wui-flex class="token-display" alignItems="center" gap="xxs">
            <wui-text variant="paragraph-600" color="fg-100">
              ${this.tokenSymbol||"Unknown Asset"}
            </wui-text>
            ${t?w`
                  <wui-text variant="small-500" color="fg-200"> on ${t} </wui-text>
                `:""}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderConnectedView(){const t=this.connectedWalletInfo?.name||"connected wallet";return w`
      <wui-list-item
        @click=${this.onWalletPayment}
        ?chevron=${!0}
        data-testid="wallet-payment-option"
      >
        <wui-flex alignItems="center" gap="s">
          <wui-wallet-image
            size="sm"
            imageSrc=${B(this.connectedWalletInfo?.icon)}
            name=${B(this.connectedWalletInfo?.name)}
          ></wui-wallet-image>
          <wui-text variant="paragraph-500" color="inherit">Pay with ${t}</wui-text>
        </wui-flex>
      </wui-list-item>

      <wui-list-item
        variant="icon"
        iconVariant="overlay"
        icon="disconnect"
        @click=${this.onDisconnect}
        data-testid="disconnect-button"
        ?chevron=${!1}
      >
        <wui-text variant="paragraph-500" color="fg-200">Disconnect</wui-text>
      </wui-list-item>
    `}renderDisconnectedView(){return w`<wui-list-item
      variant="icon"
      iconVariant="overlay"
      icon="walletPlaceholder"
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="paragraph-500" color="inherit">Pay from wallet</wui-text>
    </wui-list-item>`}renderExchangeOptions(){return this.isLoading?w`<wui-flex justifyContent="center" alignItems="center">
        <wui-spinner size="md"></wui-spinner>
      </wui-flex>`:this.exchanges.length===0?w`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="paragraph-500" color="fg-100">No exchanges available</wui-text>
      </wui-flex>`:this.exchanges.map(t=>w`
        <wui-list-item
          @click=${()=>this.onExchangePayment(t.id)}
          data-testid="exchange-option-${t.id}"
          ?chevron=${!0}
          ?disabled=${this.loadingExchangeId!==null}
        >
          <wui-flex alignItems="center" gap="s">
            ${this.loadingExchangeId===t.id?w`<wui-loading-spinner color="accent-100" size="md"></wui-loading-spinner>`:w`<wui-wallet-image
                  size="sm"
                  imageSrc=${B(t.imageUrl)}
                  name=${t.name}
                ></wui-wallet-image>`}
            <wui-text flexGrow="1" variant="paragraph-500" color="inherit"
              >Pay with ${t.name} <wui-spinner size="sm" color="fg-200"></wui-spinner
            ></wui-text>
          </wui-flex>
        </wui-list-item>
      `)}onWalletPayment(){l.handlePayWithWallet()}async onExchangePayment(t){try{this.loadingExchangeId=t;const s=await l.handlePayWithExchange(t);s&&(await D.open({view:"PayLoading"}),K.openHref(s.url,s.openInNewTab?"_blank":"_self"))}catch(s){console.error("Failed to pay with exchange",s),R.showError("Failed to pay with exchange")}finally{this.loadingExchangeId=null}}async onDisconnect(t){t.stopPropagation();try{await S.disconnect()}catch{console.error("Failed to disconnect"),R.showError("Failed to disconnect")}}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}};A.styles=Oe;P([N()],A.prototype,"amount",void 0);P([N()],A.prototype,"tokenSymbol",void 0);P([N()],A.prototype,"networkName",void 0);P([N()],A.prototype,"exchanges",void 0);P([N()],A.prototype,"isLoading",void 0);P([N()],A.prototype,"loadingExchangeId",void 0);P([N()],A.prototype,"connectedWalletInfo",void 0);A=P([ie("w3m-pay-view")],A);const Me=re`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }
`;var W=function(e,t,s,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,s):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(e,t,s,r);else for(var d=e.length-1;d>=0;d--)(o=e[d])&&(a=(i<3?o(a):i>3?o(t,s,a):o(t,s))||a);return i>3&&a&&Object.defineProperty(t,s,a),a};const De=4e3;let v=class extends ae{constructor(){super(),this.loadingMessage="",this.subMessage="",this.paymentState="in-progress",this.paymentState=l.state.isPaymentInProgress?"in-progress":"completed",this.updateMessages(),this.setupSubscription(),this.setupExchangeSubscription()}disconnectedCallback(){clearInterval(this.exchangeSubscription)}render(){return w`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center"> ${this.getStateIcon()} </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            ${this.loadingMessage}
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            ${this.subMessage}
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}updateMessages(){switch(this.paymentState){case"completed":this.loadingMessage="Payment completed",this.subMessage="Your transaction has been successfully processed";break;case"error":this.loadingMessage="Payment failed",this.subMessage="There was an error processing your transaction";break;case"in-progress":default:l.state.currentPayment?.type==="exchange"?(this.loadingMessage="Payment initiated",this.subMessage="Please complete the payment on the exchange"):(this.loadingMessage="Awaiting payment confirmation",this.subMessage="Please confirm the payment transaction in your wallet");break}}getStateIcon(){switch(this.paymentState){case"completed":return this.successTemplate();case"error":return this.errorTemplate();case"in-progress":default:return this.loaderTemplate()}}setupExchangeSubscription(){l.state.currentPayment?.type==="exchange"&&(this.exchangeSubscription=setInterval(async()=>{const t=l.state.currentPayment?.exchangeId,s=l.state.currentPayment?.sessionId;t&&s&&(await l.updateBuyStatus(t,s),l.state.currentPayment?.status==="SUCCESS"&&clearInterval(this.exchangeSubscription))},De))}setupSubscription(){l.subscribeKey("isPaymentInProgress",t=>{!t&&this.paymentState==="in-progress"&&(l.state.error||!l.state.currentPayment?.result?this.paymentState="error":this.paymentState="completed",this.updateMessages(),setTimeout(()=>{S.state.status!=="disconnected"&&D.close()},3e3))}),l.subscribeKey("error",t=>{t&&this.paymentState==="in-progress"&&(this.paymentState="error",this.updateMessages())})}loaderTemplate(){const t=we.state.themeVariables["--w3m-border-radius-master"],s=t?parseInt(t.replace("px",""),10):4,r=this.getPaymentIcon();return w`
      <wui-flex justifyContent="center" alignItems="center" style="position: relative;">
        ${r?w`<wui-wallet-image size="lg" imageSrc=${r}></wui-wallet-image>`:null}
        <wui-loading-thumbnail radius=${s*9}></wui-loading-thumbnail>
      </wui-flex>
    `}getPaymentIcon(){const t=l.state.currentPayment;if(t){if(t.type==="exchange"){const s=t.exchangeId;if(s)return l.getExchangeById(s)?.imageUrl}if(t.type==="wallet"){const s=_.state.connectedWalletInfo?.icon;if(s)return s;const r=I.state.activeChain;if(!r)return;const i=ee.getConnectorId(r);if(!i)return;const a=ee.getConnectorById(i);return a?he.getConnectorImage(a):void 0}}}successTemplate(){return w`<wui-icon size="xl" color="success-100" name="checkmark"></wui-icon>`}errorTemplate(){return w`<wui-icon size="xl" color="error-100" name="close"></wui-icon>`}};v.styles=Me;W([N()],v.prototype,"loadingMessage",void 0);W([N()],v.prototype,"subMessage",void 0);W([N()],v.prototype,"paymentState",void 0);v=W([ie("w3m-pay-loading-view")],v);async function et(e){return l.handleOpenPay(e)}function tt(){return l.getExchanges()}function nt(){return l.state.currentPayment?.result}function st(){return l.state.error}function rt(){return l.state.isPaymentInProgress}const at={network:"eip155:8453",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},it={network:"eip155:8453",asset:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},ot={network:"eip155:84532",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}};export{v as W3mPayLoadingView,A as W3mPayView,at as baseETH,ot as baseSepoliaETH,it as baseUSDC,tt as getExchanges,rt as getIsPaymentInProgress,st as getPayError,nt as getPayResult,et as openPay};
