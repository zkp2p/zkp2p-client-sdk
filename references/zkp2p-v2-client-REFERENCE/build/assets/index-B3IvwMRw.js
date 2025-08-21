import{i as u,a as p,x as b}from"./lit-element-CRwiKRQV.js";import{n as c}from"./class-map-E4R2Eani.js";import{c as f}from"./index-Cbrxnqo_.js";import{r as m,e as h,c as w}from"./index-Bcpr83TD.js";const v=u`
  button {
    border-radius: var(--local-border-radius);
    color: var(--wui-color-fg-100);
    padding: var(--local-padding);
  }

  @media (max-width: 700px) {
    :host(:not([size='sm'])) button {
      padding: var(--wui-spacing-s);
    }
  }

  button > wui-icon {
    pointer-events: none;
  }

  button:disabled > wui-icon {
    color: var(--wui-color-bg-300) !important;
  }

  button:disabled {
    background-color: transparent;
  }
`;var r=function(s,i,o,n){var a=arguments.length,e=a<3?i:n===null?n=Object.getOwnPropertyDescriptor(i,o):n,d;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(s,i,o,n);else for(var l=s.length-1;l>=0;l--)(d=s[l])&&(e=(a<3?d(e):a>3?d(i,o,e):d(i,o))||e);return a>3&&e&&Object.defineProperty(i,o,e),e};let t=class extends p{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="inherit"}render(){this.dataset.size=this.size;let i="",o="";switch(this.size){case"lg":i="--wui-border-radius-xs",o="--wui-spacing-1xs";break;case"sm":i="--wui-border-radius-3xs",o="--wui-spacing-xxs";break;default:i="--wui-border-radius-xxs",o="--wui-spacing-2xs";break}return this.style.cssText=`
    --local-border-radius: var(${i});
    --local-padding: var(${o});
    `,b`
      <button ?disabled=${this.disabled}>
        <wui-icon color=${this.iconColor} size=${this.size} name=${this.icon}></wui-icon>
      </button>
    `}};t.styles=[m,h,w,v];r([c()],t.prototype,"size",void 0);r([c({type:Boolean})],t.prototype,"disabled",void 0);r([c()],t.prototype,"icon",void 0);r([c()],t.prototype,"iconColor",void 0);t=r([f("wui-icon-link")],t);
