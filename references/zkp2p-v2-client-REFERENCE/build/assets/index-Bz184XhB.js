import{A as d,f as w,E as _,R as f,n as m,S as v,h as c,q as E,d as $,r as y,e as R}from"./index-Bcpr83TD.js";import{i as b,a as x,x as h}from"./lit-element-CRwiKRQV.js";import{n as u,o as O}from"./class-map-E4R2Eani.js";import{c as C}from"./index-Cbrxnqo_.js";function T(){try{return c.returnOpenHref(`${$.SECURE_SITE_SDK_ORIGIN}/loading`,"popupWindow","width=600,height=800,scrollbars=yes")}catch{throw new Error("Could not open social popup")}}async function U(){f.push("ConnectingFarcaster");const e=m.getAuthConnector();if(e&&!d.state.farcasterUrl)try{const{url:t}=await e.provider.getFarcasterUri();d.setFarcasterUrl(t,w.state.activeChain)}catch(t){f.goBack(),v.showError(t)}}async function j(e){f.push("ConnectingSocial");const t=m.getAuthConnector();let o=null;try{const i=setTimeout(()=>{throw new Error("Social login timed out. Please try again.")},45e3);if(t&&e){if(c.isTelegram()||(o=T()),o)d.setSocialWindow(o,w.state.activeChain);else if(!c.isTelegram())throw new Error("Could not create social popup");const{uri:n}=await t.provider.getSocialRedirectUri({provider:e});if(!n)throw o?.close(),new Error("Could not fetch the social redirect uri");if(o&&(o.location.href=n),c.isTelegram()){E.setTelegramSocialProvider(e);const r=c.formatTelegramSocialLoginUrl(n);c.openHref(r,"_top")}clearTimeout(i)}}catch(i){o?.close(),v.showError(i?.message)}}async function F(e){d.setSocialProvider(e,w.state.activeChain),_.sendEvent({type:"track",event:"SOCIAL_LOGIN_STARTED",properties:{provider:e}}),e==="farcaster"?await U():await j(e)}const L=b`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-3xl);
    border: 1px solid var(--wui-color-gray-glass-005);
    overflow: hidden;
  }

  wui-icon {
    width: 100%;
    height: 100%;
  }
`;var S=function(e,t,o,i){var n=arguments.length,r=n<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,o,i);else for(var s=e.length-1;s>=0;s--)(a=e[s])&&(r=(n<3?a(r):n>3?a(t,o,r):a(t,o))||r);return n>3&&r&&Object.defineProperty(t,o,r),r};let g=class extends x{constructor(){super(...arguments),this.logo="google"}render(){return h`<wui-icon color="inherit" size="inherit" name=${this.logo}></wui-icon> `}};g.styles=[y,L];S([u()],g.prototype,"logo",void 0);g=S([C("wui-logo")],g);const W=b`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    justify-content: flex-start;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-text[data-align='left'] {
    display: flex;
    flex: 1;
  }

  wui-text[data-align='center'] {
    display: flex;
    flex: 1;
    justify-content: center;
  }

  .invisible {
    opacity: 0;
    pointer-events: none;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }
`;var p=function(e,t,o,i){var n=arguments.length,r=n<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,o,i);else for(var s=e.length-1;s>=0;s--)(a=e[s])&&(r=(n<3?a(r):n>3?a(t,o,r):a(t,o))||r);return n>3&&r&&Object.defineProperty(t,o,r),r};let l=class extends x{constructor(){super(...arguments),this.logo="google",this.name="Continue with google",this.align="left",this.disabled=!1}render(){return h`
      <button ?disabled=${this.disabled} tabindex=${O(this.tabIdx)}>
        <wui-logo logo=${this.logo}></wui-logo>
        <wui-text
          data-align=${this.align}
          variant="paragraph-500"
          color="inherit"
          align=${this.align}
          >${this.name}</wui-text
        >
        ${this.templatePlacement()}
      </button>
    `}templatePlacement(){return this.align==="center"?h` <wui-logo class="invisible" logo=${this.logo}></wui-logo>`:null}};l.styles=[y,R,W];p([u()],l.prototype,"logo",void 0);p([u()],l.prototype,"name",void 0);p([u()],l.prototype,"align",void 0);p([u()],l.prototype,"tabIdx",void 0);p([u({type:Boolean})],l.prototype,"disabled",void 0);l=p([C("wui-list-social")],l);export{F as e};
