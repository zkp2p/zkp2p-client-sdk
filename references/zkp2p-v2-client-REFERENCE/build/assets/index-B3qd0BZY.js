import{i as p,a as f,x as u}from"./lit-element-CRwiKRQV.js";import{n as d}from"./class-map-E4R2Eani.js";import{c as m}from"./index-Cbrxnqo_.js";import{r as g}from"./index-Bcpr83TD.js";const x=p`
  :host {
    position: relative;
    display: flex;
    width: 100%;
    height: 1px;
    background-color: var(--wui-color-gray-glass-005);
    justify-content: center;
    align-items: center;
  }

  :host > wui-text {
    position: absolute;
    padding: 0px 10px;
    background-color: var(--wui-color-modal-bg);
    transition: background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: background-color;
  }
`;var c=function(o,e,r,i){var n=arguments.length,t=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,r):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,r,i);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(n<3?a(t):n>3?a(e,r,t):a(e,r))||t);return n>3&&t&&Object.defineProperty(e,r,t),t};let l=class extends f{constructor(){super(...arguments),this.text=""}render(){return u`${this.template()}`}template(){return this.text?u`<wui-text variant="small-500" color="fg-200">${this.text}</wui-text>`:null}};l.styles=[g,x];c([d()],l.prototype,"text",void 0);l=c([m("wui-separator")],l);
