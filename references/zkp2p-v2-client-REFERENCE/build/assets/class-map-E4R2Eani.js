import{f as w,u as b,E as m,T as $}from"./lit-element-CRwiKRQV.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const y={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:w},T=(t=y,e,s)=>{const{kind:n,metadata:i}=s;let o=globalThis.litPropertyMetadata.get(i);if(o===void 0&&globalThis.litPropertyMetadata.set(i,o=new Map),n==="setter"&&((t=Object.create(t)).wrapped=!0),o.set(s.name,t),n==="accessor"){const{name:c}=s;return{set(r){const h=e.get.call(this);e.set.call(this,r),this.requestUpdate(c,h,t)},init(r){return r!==void 0&&this.C(c,void 0,t,r),r}}}if(n==="setter"){const{name:c}=s;return function(r){const h=this[c];e.call(this,r),this.requestUpdate(c,h,t)}}throw Error("Unsupported decorator location: "+n)};function M(t){return(e,s)=>typeof s=="object"?T(t,e,s):((n,i,o)=>{const c=i.hasOwnProperty(o);return i.constructor.createProperty(o,n),c?Object.getOwnPropertyDescriptor(i,o):void 0})(t,e,s)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function D(t){return M({...t,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const G=t=>t??m;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const O=t=>t===null||typeof t!="object"&&typeof t!="function",P=t=>t.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const p={ATTRIBUTE:1,CHILD:2},C=t=>(...e)=>({_$litDirective$:t,values:e});let A=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,s,n){this._$Ct=e,this._$AM=s,this._$Ci=n}_$AS(e,s){return this.update(e,s)}update(e,s){return this.render(...s)}};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const d=(t,e)=>{const s=t._$AN;if(s===void 0)return!1;for(const n of s)n._$AO?.(e,!1),d(n,e);return!0},u=t=>{let e,s;do{if((e=t._$AM)===void 0)break;s=e._$AN,s.delete(t),t=e}while(s?.size===0)},v=t=>{for(let e;e=t._$AM;t=e){let s=e._$AN;if(s===void 0)e._$AN=s=new Set;else if(s.has(t))break;s.add(t),N(e)}};function U(t){this._$AN!==void 0?(u(this),this._$AM=t,v(this)):this._$AM=t}function j(t,e=!1,s=0){const n=this._$AH,i=this._$AN;if(i!==void 0&&i.size!==0)if(e)if(Array.isArray(n))for(let o=s;o<n.length;o++)d(n[o],!1),u(n[o]);else n!=null&&(d(n,!1),u(n));else d(this,t)}const N=t=>{t.type==p.CHILD&&(t._$AP??=j,t._$AQ??=U)};class I extends A{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,s,n){super._$AT(e,s,n),v(this),this.isConnected=e._$AU}_$AO(e,s=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),s&&(d(this,e),u(this))}setValue(e){if(P(this._$Ct))this._$Ct._$AI(e,this);else{const s=[...this._$Ct._$AH];s[this._$Ci]=e,this._$Ct._$AI(s,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class x{constructor(e){this.G=e}disconnect(){this.G=void 0}reconnect(e){this.G=e}deref(){return this.G}}class E{constructor(){this.Y=void 0,this.Z=void 0}get(){return this.Y}pause(){this.Y??=new Promise(e=>this.Z=e)}resume(){this.Z?.(),this.Y=this.Z=void 0}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const f=t=>!O(t)&&typeof t.then=="function",_=1073741823;class S extends I{constructor(){super(...arguments),this._$Cwt=_,this._$Cbt=[],this._$CK=new x(this),this._$CX=new E}render(...e){return e.find(s=>!f(s))??$}update(e,s){const n=this._$Cbt;let i=n.length;this._$Cbt=s;const o=this._$CK,c=this._$CX;this.isConnected||this.disconnected();for(let r=0;r<s.length&&!(r>this._$Cwt);r++){const h=s[r];if(!f(h))return this._$Cwt=r,h;r<i&&h===n[r]||(this._$Cwt=_,i=0,Promise.resolve(h).then(async g=>{for(;c.get();)await c.get();const a=o.deref();if(a!==void 0){const l=a._$Cbt.indexOf(h);l>-1&&l<a._$Cwt&&(a._$Cwt=l,a.setValue(g))}}))}return $}disconnected(){this._$CK.disconnect(),this._$CX.pause()}reconnected(){this._$CK.reconnect(this),this._$CX.resume()}}const K=C(S);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const X=C(class extends A{constructor(t){if(super(t),t.type!==p.ATTRIBUTE||t.name!=="class"||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(this.st===void 0){this.st=new Set,t.strings!==void 0&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(n=>n!=="")));for(const n in e)e[n]&&!this.nt?.has(n)&&this.st.add(n);return this.render(e)}const s=t.element.classList;for(const n of this.st)n in e||(s.remove(n),this.st.delete(n));for(const n in e){const i=!!e[n];i===this.st.has(n)||this.nt?.has(n)||(i?(s.add(n),this.st.add(n)):(s.remove(n),this.st.delete(n)))}return $}});export{X as a,C as e,I as f,K as m,M as n,G as o,D as r};
