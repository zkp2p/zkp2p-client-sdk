import{i as d,a as v,x as g}from"./lit-element-CRwiKRQV.js";import{n as l}from"./class-map-E4R2Eani.js";import{c as p}from"./index-Cbrxnqo_.js";import{r as h}from"./index-Bcpr83TD.js";const w=d`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--wui-spacing-m);
    padding: 0 var(--wui-spacing-3xs) !important;
    border-radius: var(--wui-border-radius-5xs);
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host > wui-text {
    transform: translateY(5%);
  }

  :host([data-variant='main']) {
    background-color: var(--wui-color-accent-glass-015);
    color: var(--wui-color-accent-100);
  }

  :host([data-variant='shade']) {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-200);
  }

  :host([data-variant='success']) {
    background-color: var(--wui-icon-box-bg-success-100);
    color: var(--wui-color-success-100);
  }

  :host([data-variant='error']) {
    background-color: var(--wui-icon-box-bg-error-100);
    color: var(--wui-color-error-100);
  }

  :host([data-size='lg']) {
    padding: 11px 5px !important;
  }

  :host([data-size='lg']) > wui-text {
    transform: translateY(2%);
  }

  :host([data-size='xs']) {
    height: var(--wui-spacing-2l);
    padding: 0 var(--wui-spacing-3xs) !important;
  }

  :host([data-size='xs']) > wui-text {
    transform: translateY(2%);
  }
`;var u=function(i,r,a,e){var s=arguments.length,t=s<3?r:e===null?e=Object.getOwnPropertyDescriptor(r,a):e,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,r,a,e);else for(var c=i.length-1;c>=0;c--)(n=i[c])&&(t=(s<3?n(t):s>3?n(r,a,t):n(r,a))||t);return s>3&&t&&Object.defineProperty(r,a,t),t};let o=class extends v{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const r=this.size==="md"||this.size==="xs"?"mini-700":"micro-700";return g`
      <wui-text data-variant=${this.variant} variant=${r} color="inherit">
        <slot></slot>
      </wui-text>
    `}};o.styles=[h,w];u([l()],o.prototype,"variant",void 0);u([l()],o.prototype,"size",void 0);o=u([p("wui-tag")],o);
