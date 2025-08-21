import{E as h}from"./lit-element-CRwiKRQV.js";import{e as o,f as n}from"./class-map-E4R2Eani.js";/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const d=()=>new c;class c{}const e=new WeakMap,a=o(class extends n{render(t){return h}update(t,[s]){const i=s!==this.G;return i&&this.G!==void 0&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=s,this.ht=t.options?.host,this.rt(this.ct=t.element)),h}rt(t){if(this.isConnected||(t=void 0),typeof this.G=="function"){const s=this.ht??globalThis;let i=e.get(s);i===void 0&&(i=new WeakMap,e.set(s,i)),i.get(this.G)!==void 0&&this.G.call(this.ht,void 0),i.set(this.G,t),t!==void 0&&this.G.call(this.ht,t)}else this.G.value=t}get lt(){return typeof this.G=="function"?e.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}});export{d as e,a as n};
