(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function s(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(i){if(i.ep)return;i.ep=!0;const o=s(i);fetch(i.href,o)}})();/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const at=globalThis,xt=at.ShadowRoot&&(at.ShadyCSS===void 0||at.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,$t=Symbol(),Dt=new WeakMap;let qt=class{constructor(t,s,a){if(this._$cssResult$=!0,a!==$t)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=s}get styleSheet(){let t=this.o;const s=this.t;if(xt&&t===void 0){const a=s!==void 0&&s.length===1;a&&(t=Dt.get(s)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),a&&Dt.set(s,t))}return t}toString(){return this.cssText}};const Xt=e=>new qt(typeof e=="string"?e:e+"",void 0,$t),m=(e,...t)=>{const s=e.length===1?e[0]:t.reduce((a,i,o)=>a+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new qt(s,e,$t)},Gt=(e,t)=>{if(xt)e.adoptedStyleSheets=t.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(const s of t){const a=document.createElement("style"),i=at.litNonce;i!==void 0&&a.setAttribute("nonce",i),a.textContent=s.cssText,e.appendChild(a)}},Pt=xt?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let s="";for(const a of t.cssRules)s+=a.cssText;return Xt(s)})(e):e;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Qt,defineProperty:te,getOwnPropertyDescriptor:ee,getOwnPropertyNames:se,getOwnPropertySymbols:ie,getPrototypeOf:ae}=Object,lt=globalThis,Ot=lt.trustedTypes,oe=Ot?Ot.emptyScript:"",ne=lt.reactiveElementPolyfillSupport,K=(e,t)=>e,ot={toAttribute(e,t){switch(t){case Boolean:e=e?oe:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let s=e;switch(t){case Boolean:s=e!==null;break;case Number:s=e===null?null:Number(e);break;case Object:case Array:try{s=JSON.parse(e)}catch{s=null}}return s}},wt=(e,t)=>!Qt(e,t),zt={attribute:!0,type:String,converter:ot,reflect:!1,useDefault:!1,hasChanged:wt};Symbol.metadata??=Symbol("metadata"),lt.litPropertyMetadata??=new WeakMap;let j=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=zt){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){const a=Symbol(),i=this.getPropertyDescriptor(t,a,s);i!==void 0&&te(this.prototype,t,i)}}static getPropertyDescriptor(t,s,a){const{get:i,set:o}=ee(this.prototype,t)??{get(){return this[s]},set(n){this[s]=n}};return{get:i,set(n){const d=i?.call(this);o?.call(this,n),this.requestUpdate(t,d,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??zt}static _$Ei(){if(this.hasOwnProperty(K("elementProperties")))return;const t=ae(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(K("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(K("properties"))){const s=this.properties,a=[...se(s),...ie(s)];for(const i of a)this.createProperty(i,s[i])}const t=this[Symbol.metadata];if(t!==null){const s=litPropertyMetadata.get(t);if(s!==void 0)for(const[a,i]of s)this.elementProperties.set(a,i)}this._$Eh=new Map;for(const[s,a]of this.elementProperties){const i=this._$Eu(s,a);i!==void 0&&this._$Eh.set(i,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const s=[];if(Array.isArray(t)){const a=new Set(t.flat(1/0).reverse());for(const i of a)s.unshift(Pt(i))}else t!==void 0&&s.push(Pt(t));return s}static _$Eu(t,s){const a=s.attribute;return a===!1?void 0:typeof a=="string"?a:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const a of s.keys())this.hasOwnProperty(a)&&(t.set(a,this[a]),delete this[a]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Gt(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,s,a){this._$AK(t,a)}_$ET(t,s){const a=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,a);if(i!==void 0&&a.reflect===!0){const o=(a.converter?.toAttribute!==void 0?a.converter:ot).toAttribute(s,a.type);this._$Em=t,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,s){const a=this.constructor,i=a._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const o=a.getPropertyOptions(i),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:ot;this._$Em=i;const d=n.fromAttribute(s,o.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(t,s,a,i=!1,o){if(t!==void 0){const n=this.constructor;if(i===!1&&(o=this[t]),a??=n.getPropertyOptions(t),!((a.hasChanged??wt)(o,s)||a.useDefault&&a.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,a))))return;this.C(t,s,a)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,s,{useDefault:a,reflect:i,wrapped:o},n){a&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??s??this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||a||(s=void 0),this._$AL.set(t,s)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}const a=this.constructor.elementProperties;if(a.size>0)for(const[i,o]of a){const{wrapped:n}=o,d=this[i];n!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,o,d)}}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(a=>a.hostUpdate?.()),this.update(s)):this._$EM()}catch(a){throw t=!1,this._$EM(),a}t&&this._$AE(s)}willUpdate(t){}_$AE(t){this._$EO?.forEach(s=>s.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(s=>this._$ET(s,this[s])),this._$EM()}updated(t){}firstUpdated(t){}};j.elementStyles=[],j.shadowRootOptions={mode:"open"},j[K("elementProperties")]=new Map,j[K("finalized")]=new Map,ne?.({ReactiveElement:j}),(lt.reactiveElementVersions??=[]).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const kt=globalThis,It=e=>e,nt=kt.trustedTypes,Nt=nt?nt.createPolicy("lit-html",{createHTML:e=>e}):void 0,Ft="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,Wt="?"+A,re=`<${Wt}>`,O=document,Y=()=>O.createComment(""),Z=e=>e===null||typeof e!="object"&&typeof e!="function",Ct=Array.isArray,le=e=>Ct(e)||typeof e?.[Symbol.iterator]=="function",bt=`[ 	
\f\r]`,W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Rt=/-->/g,jt=/>/g,D=RegExp(`>|${bt}(?:([^\\s"'>=/]+)(${bt}*=${bt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Mt=/'/g,Lt=/"/g,Kt=/^(?:script|style|textarea|title)$/i,de=e=>(t,...s)=>({_$litType$:e,strings:t,values:s}),c=de(1),M=Symbol.for("lit-noChange"),f=Symbol.for("lit-nothing"),Ut=new WeakMap,P=O.createTreeWalker(O,129);function Yt(e,t){if(!Ct(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return Nt!==void 0?Nt.createHTML(t):t}const ce=(e,t)=>{const s=e.length-1,a=[];let i,o=t===2?"<svg>":t===3?"<math>":"",n=W;for(let d=0;d<s;d++){const l=e[d];let u,g,p=-1,w=0;for(;w<l.length&&(n.lastIndex=w,g=n.exec(l),g!==null);)w=n.lastIndex,n===W?g[1]==="!--"?n=Rt:g[1]!==void 0?n=jt:g[2]!==void 0?(Kt.test(g[2])&&(i=RegExp("</"+g[2],"g")),n=D):g[3]!==void 0&&(n=D):n===D?g[0]===">"?(n=i??W,p=-1):g[1]===void 0?p=-2:(p=n.lastIndex-g[2].length,u=g[1],n=g[3]===void 0?D:g[3]==='"'?Lt:Mt):n===Lt||n===Mt?n=D:n===Rt||n===jt?n=W:(n=D,i=void 0);const T=n===D&&e[d+1].startsWith("/>")?" ":"";o+=n===W?l+re:p>=0?(a.push(u),l.slice(0,p)+Ft+l.slice(p)+A+T):l+A+(p===-2?d:T)}return[Yt(e,o+(e[s]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),a]};class J{constructor({strings:t,_$litType$:s},a){let i;this.parts=[];let o=0,n=0;const d=t.length-1,l=this.parts,[u,g]=ce(t,s);if(this.el=J.createElement(u,a),P.currentNode=this.el.content,s===2||s===3){const p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=P.nextNode())!==null&&l.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(const p of i.getAttributeNames())if(p.endsWith(Ft)){const w=g[n++],T=i.getAttribute(p).split(A),st=/([.?@])?(.*)/.exec(w);l.push({type:1,index:o,name:st[2],strings:T,ctor:st[1]==="."?he:st[1]==="?"?ue:st[1]==="@"?fe:dt}),i.removeAttribute(p)}else p.startsWith(A)&&(l.push({type:6,index:o}),i.removeAttribute(p));if(Kt.test(i.tagName)){const p=i.textContent.split(A),w=p.length-1;if(w>0){i.textContent=nt?nt.emptyScript:"";for(let T=0;T<w;T++)i.append(p[T],Y()),P.nextNode(),l.push({type:2,index:++o});i.append(p[w],Y())}}}else if(i.nodeType===8)if(i.data===Wt)l.push({type:2,index:o});else{let p=-1;for(;(p=i.data.indexOf(A,p+1))!==-1;)l.push({type:7,index:o}),p+=A.length-1}o++}}static createElement(t,s){const a=O.createElement("template");return a.innerHTML=t,a}}function L(e,t,s=e,a){if(t===M)return t;let i=a!==void 0?s._$Co?.[a]:s._$Cl;const o=Z(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(e),i._$AT(e,s,a)),a!==void 0?(s._$Co??=[])[a]=i:s._$Cl=i),i!==void 0&&(t=L(e,i._$AS(e,t.values),i,a)),t}class pe{constructor(t,s){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:s},parts:a}=this._$AD,i=(t?.creationScope??O).importNode(s,!0);P.currentNode=i;let o=P.nextNode(),n=0,d=0,l=a[0];for(;l!==void 0;){if(n===l.index){let u;l.type===2?u=new Q(o,o.nextSibling,this,t):l.type===1?u=new l.ctor(o,l.name,l.strings,this,t):l.type===6&&(u=new ge(o,this,t)),this._$AV.push(u),l=a[++d]}n!==l?.index&&(o=P.nextNode(),n++)}return P.currentNode=O,i}p(t){let s=0;for(const a of this._$AV)a!==void 0&&(a.strings!==void 0?(a._$AI(t,a,s),s+=a.strings.length-2):a._$AI(t[s])),s++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,s,a,i){this.type=2,this._$AH=f,this._$AN=void 0,this._$AA=t,this._$AB=s,this._$AM=a,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const s=this._$AM;return s!==void 0&&t?.nodeType===11&&(t=s.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,s=this){t=L(this,t,s),Z(t)?t===f||t==null||t===""?(this._$AH!==f&&this._$AR(),this._$AH=f):t!==this._$AH&&t!==M&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):le(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==f&&Z(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:s,_$litType$:a}=t,i=typeof a=="number"?this._$AC(t):(a.el===void 0&&(a.el=J.createElement(Yt(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===i)this._$AH.p(s);else{const o=new pe(i,this),n=o.u(this.options);o.p(s),this.T(n),this._$AH=o}}_$AC(t){let s=Ut.get(t.strings);return s===void 0&&Ut.set(t.strings,s=new J(t)),s}k(t){Ct(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let a,i=0;for(const o of t)i===s.length?s.push(a=new Q(this.O(Y()),this.O(Y()),this,this.options)):a=s[i],a._$AI(o),i++;i<s.length&&(this._$AR(a&&a._$AB.nextSibling,i),s.length=i)}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);t!==this._$AB;){const a=It(t).nextSibling;It(t).remove(),t=a}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class dt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,s,a,i,o){this.type=1,this._$AH=f,this._$AN=void 0,this.element=t,this.name=s,this._$AM=i,this.options=o,a.length>2||a[0]!==""||a[1]!==""?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=f}_$AI(t,s=this,a,i){const o=this.strings;let n=!1;if(o===void 0)t=L(this,t,s,0),n=!Z(t)||t!==this._$AH&&t!==M,n&&(this._$AH=t);else{const d=t;let l,u;for(t=o[0],l=0;l<o.length-1;l++)u=L(this,d[a+l],s,l),u===M&&(u=this._$AH[l]),n||=!Z(u)||u!==this._$AH[l],u===f?t=f:t!==f&&(t+=(u??"")+o[l+1]),this._$AH[l]=u}n&&!i&&this.j(t)}j(t){t===f?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class he extends dt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===f?void 0:t}}class ue extends dt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==f)}}class fe extends dt{constructor(t,s,a,i,o){super(t,s,a,i,o),this.type=5}_$AI(t,s=this){if((t=L(this,t,s,0)??f)===M)return;const a=this._$AH,i=t===f&&a!==f||t.capture!==a.capture||t.once!==a.once||t.passive!==a.passive,o=t!==f&&(a===f||i);i&&this.element.removeEventListener(this.name,this,a),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ge{constructor(t,s,a){this.element=t,this.type=6,this._$AN=void 0,this._$AM=s,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(t){L(this,t)}}const me=kt.litHtmlPolyfillSupport;me?.(J,Q),(kt.litHtmlVersions??=[]).push("3.3.2");const be=(e,t,s)=>{const a=s?.renderBefore??t;let i=a._$litPart$;if(i===void 0){const o=s?.renderBefore??null;a._$litPart$=i=new Q(t.insertBefore(Y(),o),o,void 0,s??{})}return i._$AI(e),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Tt=globalThis;class h extends j{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=be(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return M}}h._$litElement$=!0,h.finalized=!0,Tt.litElementHydrateSupport?.({LitElement:h});const ye=Tt.litElementPolyfillSupport;ye?.({LitElement:h});(Tt.litElementVersions??=[]).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const b=e=>(t,s)=>{s!==void 0?s.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ve={attribute:!0,type:String,converter:ot,reflect:!1,hasChanged:wt},_e=(e=ve,t,s)=>{const{kind:a,metadata:i}=s;let o=globalThis.litPropertyMetadata.get(i);if(o===void 0&&globalThis.litPropertyMetadata.set(i,o=new Map),a==="setter"&&((e=Object.create(e)).wrapped=!0),o.set(s.name,e),a==="accessor"){const{name:n}=s;return{set(d){const l=t.get.call(this);t.set.call(this,d),this.requestUpdate(n,l,e,!0,d)},init(d){return d!==void 0&&this.C(n,void 0,e,d),d}}}if(a==="setter"){const{name:n}=s;return function(d){const l=this[n];t.call(this,d),this.requestUpdate(n,l,e,!0,d)}}throw Error("Unsupported decorator location: "+a)};function r(e){return(t,s)=>typeof s=="object"?_e(e,t,s):((a,i,o)=>{const n=i.hasOwnProperty(o);return i.constructor.createProperty(o,a),n?Object.getOwnPropertyDescriptor(i,o):void 0})(e,t,s)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function y(e){return r({...e,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const xe=(e,t,s)=>(s.configurable=!0,s.enumerable=!0,Reflect.decorate&&typeof t!="object"&&Object.defineProperty(e,t,s),s);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function $e(e,t){return(s,a,i)=>{const o=n=>n.renderRoot?.querySelector(e)??null;return xe(s,a,{get(){return o(this)}})}}const ct={PLANNER_STATE:"tomato-planner-state",USER_PREFERENCES:"tomato-planner-preferences",TIMER_STATE:"tomato-planner-timer"},yt=8,Bt=1,rt=20;function we(e,t){return{dailyCapacity:e,date:t??Zt(new Date)}}function Zt(e){return e.toISOString().split("T")[0]??""}function Jt(){return Zt(new Date)}function ke(e){return e.date!==Jt()}const At=1;function it(e=yt){return{pool:we(e),tasks:[],version:At}}function vt(e){return e.tasks.reduce((t,s)=>t+s.tomatoCount,0)}function pt(e){return e.pool.dailyCapacity-vt(e)}function Ce(e){return pt(e)<=0}function Te(e){return pt(e)<0}function Ae(){return typeof crypto<"u"&&typeof crypto.randomUUID=="function"?crypto.randomUUID():`${Date.now()}-${Ee(8)}`}function Ee(e){const t="abcdefghijklmnopqrstuvwxyz0123456789";let s="";if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function"){const a=new Uint32Array(e);crypto.getRandomValues(a);for(let i=0;i<e;i++)s+=t[a[i]%t.length]}else for(let a=0;a<e;a++)s+=t.charAt(Math.floor(Math.random()*t.length));return s}function Se(e){return typeof e!="number"||isNaN(e)?{valid:!1,error:"Capacity must be a valid number"}:e<Bt?{valid:!1,error:`Capacity must be at least ${Bt}`}:e>rt?{valid:!1,error:`Capacity cannot exceed ${rt}`}:Number.isInteger(e)?{valid:!0}:{valid:!1,error:"Capacity must be a whole number"}}function De(e,t){return pt(e)<=0?{valid:!1,error:"No tomatoes remaining. Increase capacity or remove assignments from other tasks."}:{valid:!0}}function Pe(e){return e<=0?{valid:!1,error:"No tomatoes assigned to this task"}:{valid:!0}}function Ht(e){return typeof e!="number"||isNaN(e)?{valid:!1,error:"Tomato count must be a valid number"}:e<0?{valid:!1,error:"Tomato count cannot be negative"}:Number.isInteger(e)?e>rt?{valid:!1,error:`Tomato count cannot exceed daily capacity of ${rt}`}:{valid:!0}:{valid:!1,error:"Tomato count must be a whole number"}}function Vt(e){const t=e.trim();return t.length===0?{valid:!1,error:"Task title cannot be empty"}:t.length>200?{valid:!1,error:"Task title cannot exceed 200 characters"}:{valid:!0}}function Oe(e,t,s){return{dailyCapacity:e,tasks:t,savedDate:s,version:At}}function ze(e){if(typeof e!="object"||e===null)return!1;const t=e;return typeof t.dailyCapacity=="number"&&t.dailyCapacity>0&&Array.isArray(t.tasks)&&typeof t.savedDate=="string"&&typeof t.version=="number"}function Ie(e){return{...e,version:At}}function Ne(e){const t=Oe(e.pool.dailyCapacity,e.tasks,Jt());try{const s=JSON.stringify(t);localStorage.setItem(ct.PLANNER_STATE,s)}catch(s){console.error("Failed to save planner state:",s)}}function Re(){const e=je();return e.state?(e.needsMigration&&Me(e.state),{pool:{dailyCapacity:e.state.dailyCapacity,date:e.state.savedDate},tasks:e.state.tasks,version:e.state.version}):null}function je(){try{const e=localStorage.getItem(ct.PLANNER_STATE);if(!e)return{state:null,needsMigration:!1};const t=JSON.parse(e);if(!ze(t))return console.warn("Invalid persisted state format, discarding"),{state:null,needsMigration:!1};const a=t.version!==1;return{state:a?Ie(t):t,needsMigration:a}}catch(e){return console.error("Failed to load planner state:",e),{state:null,error:String(e),needsMigration:!1}}}function Me(e){try{const t=JSON.stringify(e);localStorage.setItem(ct.PLANNER_STATE,t)}catch(t){console.error("Failed to save persisted state:",t)}}function Le(){try{localStorage.removeItem(ct.PLANNER_STATE)}catch(e){console.error("Failed to clear planner state:",e)}}class Ue{constructor(){this.subscribers=new Set;const t=Re();if(t&&!ke(t.pool))this.state=it(t.pool.dailyCapacity),this.state={...this.state,pool:t.pool,tasks:t.tasks};else{const s=t?.pool.dailyCapacity??yt;this.state=it(s)}}getState(){return{...this.state,tasks:[...this.state.tasks]}}subscribe(t){return this.subscribers.add(t),t(this.getState()),()=>{this.subscribers.delete(t)}}notify(){const t=this.getState();for(const s of this.subscribers)s(t)}setState(t){this.state=t,Ne(t),this.notify()}setCapacity(t){const s=Se(t);return s.valid?(this.setState({...this.state,pool:{...this.state.pool,dailyCapacity:t}}),{success:!0}):{success:!1,error:s.error}}addTask(t,s){const a=Vt(t);if(!a.valid)return{success:!1,error:a.error};const i=Ae(),o=new Date().toISOString(),n={id:i,title:t.trim(),description:s?.trim(),tomatoCount:0,createdAt:o,updatedAt:o};return this.setState({...this.state,tasks:[...this.state.tasks,n]}),{success:!0,taskId:i}}updateTask(t,s){const a=this.state.tasks.findIndex(n=>n.id===t);if(a===-1)return{success:!1,error:"Task not found"};if(s.title!==void 0){const n=Vt(s.title);if(!n.valid)return{success:!1,error:n.error}}const i=[...this.state.tasks],o=i[a];return i[a]={...o,...s,title:s.title?.trim()??o.title,description:s.description!==void 0?s.description?.trim():o.description,updatedAt:new Date().toISOString()},this.setState({...this.state,tasks:i}),{success:!0}}removeTask(t){return this.state.tasks.findIndex(a=>a.id===t)===-1?{success:!1,error:"Task not found"}:(this.setState({...this.state,tasks:this.state.tasks.filter(a=>a.id!==t)}),{success:!0})}assignTomato(t){const s=this.state.tasks.find(n=>n.id===t);if(!s)return{success:!1,error:"Task not found"};const a=De(this.state,s.tomatoCount);if(!a.valid)return{success:!1,error:a.error};const i=s.tomatoCount+1,o=Ht(i);return o.valid?(this.setState({...this.state,tasks:this.state.tasks.map(n=>n.id===t?{...n,tomatoCount:i,updatedAt:new Date().toISOString()}:n)}),{success:!0}):{success:!1,error:o.error}}unassignTomato(t){const s=this.state.tasks.find(i=>i.id===t);if(!s)return{success:!1,error:"Task not found"};const a=Pe(s.tomatoCount);return a.valid?(this.setState({...this.state,tasks:this.state.tasks.map(i=>i.id===t?{...i,tomatoCount:s.tomatoCount-1,updatedAt:new Date().toISOString()}:i)}),{success:!0}):{success:!1,error:a.error}}setTomatoCount(t,s){const a=this.state.tasks.find(d=>d.id===t);if(!a)return{success:!1,error:"Task not found"};const i=Ht(s);if(!i.valid)return{success:!1,error:i.error};const o=vt(this.state),n=this.state.pool.dailyCapacity-o+a.tomatoCount;return s>n?{success:!1,error:`Not enough tomatoes available. Maximum: ${n}`}:(this.setState({...this.state,tasks:this.state.tasks.map(d=>d.id===t?{...d,tomatoCount:s,updatedAt:new Date().toISOString()}:d)}),{success:!0})}resetDay(){const t=it(this.state.pool.dailyCapacity);this.setState(t)}clearAllData(){Le(),this.state=it(yt),this.notify()}get assignedTomatoes(){return vt(this.state)}get remainingTomatoes(){return pt(this.state)}get isAtCapacity(){return Ce(this.state)}get isOverCapacity(){return Te(this.state)}get dailyCapacity(){return this.state.pool.dailyCapacity}get currentDate(){return this.state.pool.date}get tasks(){return this.state.tasks}getTaskById(t){return this.state.tasks.find(s=>s.id===t)}getTasksSortedByTomatoes(){return[...this.state.tasks].sort((t,s)=>s.tomatoCount-t.tomatoCount)}getTasksWithTomatoes(){return this.state.tasks.filter(t=>t.tomatoCount>0)}get taskCount(){return this.state.tasks.length}}const _=new Ue;var Be=Object.getOwnPropertyDescriptor,He=(e,t,s,a)=>{for(var i=a>1?void 0:a?Be(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=n(i)||i);return i};let _t=class extends h{render(){return c`
      <div class="shell-container">
        <slot name="header"></slot>
        <div class="main-content">
          <div class="panel left-panel">
            <slot name="pool-panel"></slot>
          </div>
          <div class="panel right-panel">
            <slot name="task-panel"></slot>
          </div>
        </div>
      </div>
    `}};_t.styles=m`
    :host {
      display: block;
      height: 100%;
    }

    .shell-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f9fafb;
    }

    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .left-panel {
      width: 320px;
      min-width: 280px;
      max-width: 400px;
      background: white;
      border-right: 1px solid #e5e7eb;
    }

    .right-panel {
      flex: 1;
      background: #f9fafb;
    }

    /* Responsive layout */
    @media (max-width: 768px) {
      .main-content {
        flex-direction: column;
      }

      .left-panel {
        width: 100%;
        max-width: none;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
        max-height: 45vh;
      }

      .right-panel {
        flex: 1;
      }
    }
  `;_t=He([b("app-shell")],_t);var Ve=Object.defineProperty,qe=Object.getOwnPropertyDescriptor,Et=(e,t,s,a)=>{for(var i=a>1?void 0:a?qe(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&Ve(t,s,i),i};let X=class extends h{constructor(){super(...arguments),this.size=24,this.color="#ef4444"}render(){const{size:e,color:t}=this;return c`
      <svg
        width=${e}
        height=${e}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="--tomato-color: ${t}"
      >
        <!-- Main tomato body -->
        <path
          class="tomato-body"
          d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z"
        />
        <!-- Highlight -->
        <path
          class="tomato-highlight"
          d="M8 9C8 7.89543 8.89543 7 10 7C11.1046 7 12 7.89543 12 9C12 9.55228 11.5523 10 11 10H9C8.44772 10 8 9.55228 8 9Z"
          opacity="0.6"
        />
        <!-- Stem -->
        <rect class="tomato-stem" x="11" y="2" width="2" height="3" rx="0.5" />
        <!-- Left leaf -->
        <path
          class="tomato-leaf"
          d="M12 3C12 3 10 4 9 5C8 6 8 7 8 7C8 7 9 5 12 3Z"
        />
        <!-- Right leaf -->
        <path
          class="tomato-leaf"
          d="M12 3C12 3 14 4 15 5C16 6 16 7 16 7C16 7 15 5 12 3Z"
        />
      </svg>
    `}};X.styles=m`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    svg {
      display: block;
    }

    .tomato-body {
      fill: var(--tomato-color, #ef4444);
    }

    .tomato-highlight {
      fill: #fca5a5;
    }

    .tomato-stem {
      fill: #22c55e;
    }

    .tomato-leaf {
      fill: #16a34a;
    }
  `;Et([r({type:Number})],X.prototype,"size",2);Et([r({type:String})],X.prototype,"color",2);X=Et([b("tomato-icon")],X);var Fe=Object.defineProperty,We=Object.getOwnPropertyDescriptor,St=(e,t,s,a)=>{for(var i=a>1?void 0:a?We(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&Fe(t,s,i),i};let G=class extends h{constructor(){super(...arguments),this.currentDate="",this.showReset=!1}_formatDate(e){return e?new Date(e).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}):""}_handleReset(){this.dispatchEvent(new CustomEvent("reset-day",{bubbles:!0,composed:!0}))}render(){return c`
      <header>
        <div class="logo-section">
          <div class="logo-text">
            <h1>Tomato Planner</h1>
            <span class="subtitle">Pomodoro Task Manager</span>
          </div>
        </div>
        ${this.currentDate?c`<div class="date-display">
              ${this._formatDate(this.currentDate)}
            </div>`:null}
        ${this.showReset?c`
              <div class="actions">
                <button class="reset-btn" @click=${this._handleReset}>
                  Reset Day
                </button>
              </div>
            `:null}
      </header>
    `}};G.styles=m`
    :host {
      display: block;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-text {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #ef4444;
      margin: 0;
    }

    .subtitle {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 400;
    }

    .date-display {
      font-size: 14px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 6px 12px;
      border-radius: 8px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .reset-btn {
      padding: 6px 12px;
      font-size: 13px;
      background: transparent;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .reset-btn:hover {
      background: #fee2e2;
      border-color: #fecaca;
      color: #dc2626;
    }
  `;St([r({type:String})],G.prototype,"currentDate",2);St([r({type:Boolean})],G.prototype,"showReset",2);G=St([b("app-header")],G);var Ke=Object.defineProperty,Ye=Object.getOwnPropertyDescriptor,ht=(e,t,s,a)=>{for(var i=a>1?void 0:a?Ye(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&Ke(t,s,i),i};let U=class extends h{constructor(){super(...arguments),this.capacity=8,this.assigned=0,this.showLegend=!0}_renderTomato(e,t){return c`
      <div class="tomato-wrapper ${t?"assigned":"remaining"}">
        <tomato-icon size="28"></tomato-icon>
      </div>
    `}render(){const{capacity:e,assigned:t}=this,s=Math.max(0,e-t);if(e===0)return c` <div class="empty-pool">No tomatoes in your pool</div> `;const a=Array.from({length:t},(o,n)=>this._renderTomato(n,!0)),i=Array.from({length:s},(o,n)=>this._renderTomato(n+t,!1));return c`
      <div class="pool-container">${a} ${i}</div>
      ${this.showLegend?c`
            <div class="legend">
              <div class="legend-item">
                <div class="legend-dot assigned"></div>
                <span>Assigned (${t})</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot remaining"></div>
                <span>Available (${s})</span>
              </div>
            </div>
          `:null}
    `}};U.styles=m`
    :host {
      display: block;
    }

    .pool-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      border-radius: 12px;
      border: 1px solid #fecaca;
    }

    .tomato-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .tomato-wrapper:hover {
      transform: scale(1.1);
    }

    .assigned {
      opacity: 1;
    }

    .remaining {
      opacity: 0.35;
    }

    .count-badge {
      position: absolute;
      top: -4px;
      right: -8px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .empty-pool {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #9ca3af;
      font-size: 14px;
    }

    .legend {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: #6b7280;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-dot.assigned {
      background: #ef4444;
    }

    .legend-dot.remaining {
      background: #fecaca;
    }
  `;ht([r({type:Number})],U.prototype,"capacity",2);ht([r({type:Number})],U.prototype,"assigned",2);ht([r({type:Boolean})],U.prototype,"showLegend",2);U=ht([b("tomato-pool-visual")],U);var Ze=Object.defineProperty,Je=Object.getOwnPropertyDescriptor,ut=(e,t,s,a)=>{for(var i=a>1?void 0:a?Je(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&Ze(t,s,i),i};let B=class extends h{constructor(){super(...arguments),this.title="No items",this.description="",this.icon=""}render(){return c`
      <div class="container">
        ${this.icon?c`<div class="icon">${this.icon}</div>`:null}
        <h3 class="title">${this.title}</h3>
        ${this.description?c`<p class="description">${this.description}</p>`:null}
        <slot name="action"></slot>
      </div>
    `}};B.styles=m`
    :host {
      display: block;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 8px 0;
    }

    .description {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      max-width: 280px;
      line-height: 1.5;
    }

    ::slotted([slot="action"]) {
      margin-top: 16px;
    }
  `;ut([r({type:String})],B.prototype,"title",2);ut([r({type:String})],B.prototype,"description",2);ut([r({type:String})],B.prototype,"icon",2);B=ut([b("empty-state")],B);var Xe=Object.defineProperty,Ge=Object.getOwnPropertyDescriptor,tt=(e,t,s,a)=>{for(var i=a>1?void 0:a?Ge(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&Xe(t,s,i),i};let z=class extends h{constructor(){super(...arguments),this.capacity=8,this.assigned=0,this.remaining=8,this.taskCount=0}_handleDecreaseCapacity(){this.capacity>1&&this.dispatchEvent(new CustomEvent("capacity-change",{bubbles:!0,composed:!0,detail:{capacity:this.capacity-1}}))}_handleIncreaseCapacity(){this.capacity<20&&this.dispatchEvent(new CustomEvent("capacity-change",{bubbles:!0,composed:!0,detail:{capacity:this.capacity+1}}))}_getProgressPercent(){return this.capacity===0?0:Math.min(100,this.assigned/this.capacity*100)}_isOverCapacity(){return this.remaining<0}_isAtCapacity(){return this.remaining===0&&this.assigned>0}render(){const e=this._getProgressPercent(),t=this._isOverCapacity(),s=this._isAtCapacity();return c`
      <div class="panel-content">
        <h2 class="panel-title">Today's Tomato Pool</h2>

        <div class="stats-card">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${this.assigned}</div>
              <div class="stat-label">Assigned</div>
            </div>
            <div class="stat-item remaining">
              <div class="stat-value">${Math.max(0,this.remaining)}</div>
              <div class="stat-label">Available</div>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-bar">
              <div
                class="progress-fill ${t?"over-capacity":""}"
                style="width: ${e}%"
              ></div>
            </div>
            <div class="progress-label">
              <span>0</span>
              <span>${this.assigned} / ${this.capacity}</span>
              <span>${this.capacity}</span>
            </div>
          </div>

          ${t?c`
                <div class="warning-message">
                  <span>⚠️</span>
                  <span
                    >Over capacity by ${Math.abs(this.remaining)} tomatoes</span
                  >
                </div>
              `:s?c`
                  <div class="at-capacity-message">
                    <span>✅</span>
                    <span>All tomatoes assigned!</span>
                  </div>
                `:null}
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-title">Daily Capacity</span>
          </div>
          <div class="capacity-control">
            <button
              class="capacity-btn"
              @click=${this._handleDecreaseCapacity}
              ?disabled=${this.capacity<=1}
              aria-label="Decrease capacity"
            >
              −
            </button>
            <span class="capacity-value">${this.capacity}</span>
            <button
              class="capacity-btn"
              @click=${this._handleIncreaseCapacity}
              ?disabled=${this.capacity>=20}
              aria-label="Increase capacity"
            >
              +
            </button>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-title">Visual</span>
          </div>
          <tomato-pool-visual
            .capacity=${this.capacity}
            .assigned=${this.assigned}
          ></tomato-pool-visual>
        </div>
      </div>
    `}};z.styles=m`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 16px 0;
    }

    .stats-card {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #ef4444;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .stat-item.remaining .stat-value {
      color: #22c55e;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .capacity-control {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 12px;
    }

    .capacity-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: white;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 16px;
      font-weight: 600;
      color: #6b7280;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .capacity-btn:hover:not(:disabled) {
      background: #fee2e2;
      color: #ef4444;
    }

    .capacity-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .capacity-value {
      min-width: 40px;
      text-align: center;
      font-size: 18px;
      font-weight: 600;
      color: #374151;
    }

    .progress-section {
      margin-top: 16px;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #ef4444);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-fill.over-capacity {
      background: #ef4444;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 13px;
      color: #92400e;
    }

    .at-capacity-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #dcfce7;
      border: 1px solid #86efac;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 13px;
      color: #166534;
    }
  `;tt([r({type:Number})],z.prototype,"capacity",2);tt([r({type:Number})],z.prototype,"assigned",2);tt([r({type:Number})],z.prototype,"remaining",2);tt([r({type:Number})],z.prototype,"taskCount",2);z=tt([b("tomato-pool-panel")],z);var Qe=Object.defineProperty,ts=Object.getOwnPropertyDescriptor,F=(e,t,s,a)=>{for(var i=a>1?void 0:a?ts(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&Qe(t,s,i),i};let E=class extends h{constructor(){super(...arguments),this.count=0,this.maxCount=20,this.remaining=0,this.disabled=!1,this.showCount=!0}_handleAdd(){this.disabled||this.count>=this.maxCount||this.remaining<=0||this.dispatchEvent(new CustomEvent("add-tomato",{bubbles:!0,composed:!0,detail:{currentCount:this.count}}))}_handleRemove(){this.disabled||this.count<=0||this.dispatchEvent(new CustomEvent("remove-tomato",{bubbles:!0,composed:!0,detail:{currentCount:this.count}}))}_canAdd(){return!this.disabled&&this.count<this.maxCount&&this.remaining>0}_canRemove(){return!this.disabled&&this.count>0}render(){return c`
      <div class="control-group">
        <button
          class="btn btn-remove"
          @click=${this._handleRemove}
          ?disabled=${!this._canRemove()}
          aria-label="Remove tomato"
          title="Remove tomato"
        >
          −
        </button>
        ${this.showCount?c`<span class="count ${this.count>0?"has-value":""}"
              >${this.count}</span
            >`:null}
        <button
          class="btn btn-add"
          @click=${this._handleAdd}
          ?disabled=${!this._canAdd()}
          aria-label="Add tomato"
          title="Add tomato"
        >
          +
        </button>
      </div>
    `}};E.styles=m`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 2px;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 16px;
      font-weight: 600;
      color: #6b7280;
    }

    .btn:hover:not(:disabled) {
      background: #e5e7eb;
      color: #374151;
    }

    .btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .btn-add:hover:not(:disabled) {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-remove:hover:not(:disabled) {
      background: #fee2e2;
      color: #dc2626;
    }

    .count {
      min-width: 28px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .count.has-value {
      color: #ef4444;
    }

    .tomato-display {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .mini-tomato {
      font-size: 18px;
      line-height: 1;
    }
  `;F([r({type:Number})],E.prototype,"count",2);F([r({type:Number})],E.prototype,"maxCount",2);F([r({type:Number})],E.prototype,"remaining",2);F([r({type:Boolean})],E.prototype,"disabled",2);F([r({type:Boolean})],E.prototype,"showCount",2);E=F([b("tomato-assignment-control")],E);var es=Object.defineProperty,ss=Object.getOwnPropertyDescriptor,ft=(e,t,s,a)=>{for(var i=a>1?void 0:a?ss(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&es(t,s,i),i};let H=class extends h{constructor(){super(...arguments),this.label="",this.disabled=!1,this.size="md"}_handleClick(e){if(this.disabled){e.preventDefault(),e.stopPropagation();return}this.dispatchEvent(new CustomEvent("icon-click",{bubbles:!0,composed:!0}))}render(){return c`
      <button
        type="button"
        aria-label=${this.label}
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
      ${this.label?c`<span class="tooltip">${this.label}</span>`:null}
    `}};H.styles=m`
    :host {
      display: inline-flex;
      position: relative;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      color: inherit;
    }

    button:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.05);
    }

    button:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 8px;
      background: #1f2937;
      color: white;
      font-size: 12px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.15s ease,
        visibility 0.15s ease;
      pointer-events: none;
      z-index: 100;
    }

    .tooltip::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: #1f2937;
    }

    button:hover:not(:disabled) + .tooltip,
    button:focus:not(:disabled) + .tooltip {
      opacity: 1;
      visibility: visible;
    }

    ::slotted(svg) {
      width: 20px;
      height: 20px;
    }
  `;ft([r({type:String})],H.prototype,"label",2);ft([r({type:Boolean})],H.prototype,"disabled",2);ft([r({type:String})],H.prototype,"size",2);H=ft([b("icon-button")],H);var is=Object.defineProperty,as=Object.getOwnPropertyDescriptor,gt=(e,t,s,a)=>{for(var i=a>1?void 0:a?as(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&is(t,s,i),i};const os='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>',ns='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" /></svg>';let V=class extends h{constructor(){super(...arguments),this.remaining=0,this.disabled=!1}_handleEdit(){this.dispatchEvent(new CustomEvent("edit-task",{bubbles:!0,composed:!0,detail:{taskId:this.task.id}}))}_handleDelete(){this.dispatchEvent(new CustomEvent("delete-task",{bubbles:!0,composed:!0,detail:{taskId:this.task.id}}))}_handleAddTomato(){this.dispatchEvent(new CustomEvent("add-tomato",{bubbles:!0,composed:!0,detail:{taskId:this.task.id}}))}_handleRemoveTomato(){this.dispatchEvent(new CustomEvent("remove-tomato",{bubbles:!0,composed:!0,detail:{taskId:this.task.id}}))}_truncateDescription(e,t=100){return e.length<=t?e:e.slice(0,t)+"..."}render(){const{task:e,remaining:t,disabled:s}=this;return c`
      <div class="task-card">
        <div class="task-header">
          <h3 class="task-title">${e.title}</h3>
          <div class="task-actions">
            <icon-button label="Edit task" @icon-click=${this._handleEdit}>
              ${os}
            </icon-button>
            <icon-button label="Delete task" @icon-click=${this._handleDelete}>
              ${ns}
            </icon-button>
          </div>
        </div>

        ${e.description?c`<p class="task-description">
              ${this._truncateDescription(e.description)}
            </p>`:null}

        <div class="task-footer">
          <div class="tomato-count-badge">
            <tomato-icon size="16"></tomato-icon>
            <span>${e.tomatoCount}</span>
          </div>
          <tomato-assignment-control
            .count=${e.tomatoCount}
            .remaining=${t}
            .disabled=${s}
            @add-tomato=${this._handleAddTomato}
            @remove-tomato=${this._handleRemoveTomato}
          ></tomato-assignment-control>
        </div>
      </div>
    `}};V.styles=m`
    :host {
      display: block;
    }

    .task-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .task-card:hover {
      border-color: #fecaca;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
    }

    .task-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .task-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
      line-height: 1.4;
      flex: 1;
      word-break: break-word;
    }

    .task-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .task-description {
      font-size: 13px;
      color: #6b7280;
      margin: 0 0 12px 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
    }

    .tomato-count-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #fef2f2;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 600;
      color: #ef4444;
    }

    .no-description {
      font-style: italic;
      color: #9ca3af;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #9ca3af;
    }
  `;gt([r({type:Object})],V.prototype,"task",2);gt([r({type:Number})],V.prototype,"remaining",2);gt([r({type:Boolean})],V.prototype,"disabled",2);V=gt([b("task-item")],V);var rs=Object.defineProperty,ls=Object.getOwnPropertyDescriptor,mt=(e,t,s,a)=>{for(var i=a>1?void 0:a?ls(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&rs(t,s,i),i};let q=class extends h{constructor(){super(...arguments),this.tasks=[],this.remaining=0,this.disabled=!1}_handleEditTask(e){this.dispatchEvent(new CustomEvent("edit-task",{bubbles:!0,composed:!0,detail:e.detail}))}_handleDeleteTask(e){this.dispatchEvent(new CustomEvent("delete-task",{bubbles:!0,composed:!0,detail:e.detail}))}_handleAddTomato(e){this.dispatchEvent(new CustomEvent("add-tomato",{bubbles:!0,composed:!0,detail:e.detail}))}_handleRemoveTomato(e){this.dispatchEvent(new CustomEvent("remove-tomato",{bubbles:!0,composed:!0,detail:e.detail}))}render(){return this.tasks.length===0?c`
        <div class="empty-container">
          <empty-state
            icon="📋"
            title="No tasks yet"
            description="Add your first task to start planning your day"
          ></empty-state>
        </div>
      `:c`
      <div class="task-list">
        ${this.tasks.map(e=>c`
            <task-item
              .task=${e}
              .remaining=${this.remaining}
              .disabled=${this.disabled}
              @edit-task=${this._handleEditTask}
              @delete-task=${this._handleDeleteTask}
              @add-tomato=${this._handleAddTomato}
              @remove-tomato=${this._handleRemoveTomato}
            ></task-item>
          `)}
      </div>
    `}};q.styles=m`
    :host {
      display: block;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-container {
      padding: 24px;
    }
  `;mt([r({type:Array})],q.prototype,"tasks",2);mt([r({type:Number})],q.prototype,"remaining",2);mt([r({type:Boolean})],q.prototype,"disabled",2);q=mt([b("task-list")],q);var ds=Object.defineProperty,cs=Object.getOwnPropertyDescriptor,N=(e,t,s,a)=>{for(var i=a>1?void 0:a?cs(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&ds(t,s,i),i};let k=class extends h{constructor(){super(...arguments),this.submitLabel="Create Task",this._title="",this._description="",this._titleError="",this._maxTitleLength=200,this._maxDescriptionLength=1e3}updated(e){super.updated(e),e.has("task")&&(this.task?(this._title=this.task.title,this._description=this.task.description??""):(this._title="",this._description=""),this._titleError="")}firstUpdated(){this._titleInput?.focus()}_validateTitle(){const e=this._title.trim();return e.length===0?(this._titleError="Task title is required",!1):e.length>this._maxTitleLength?(this._titleError=`Title must be ${this._maxTitleLength} characters or less`,!1):(this._titleError="",!0)}_handleTitleInput(e){this._title=e.target.value,this._titleError&&this._validateTitle()}_handleDescriptionInput(e){this._description=e.target.value}_handleSubmit(e){e.preventDefault(),this._validateTitle()&&this.dispatchEvent(new CustomEvent("submit",{bubbles:!0,composed:!0,detail:{title:this._title.trim(),description:this._description.trim()||void 0}}))}_handleCancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_getTitleCharCountClass(){const e=this._maxTitleLength-this._title.length;return e<0?"error":e<20?"warning":""}_getDescriptionCharCountClass(){const e=this._maxDescriptionLength-this._description.length;return e<0?"error":e<50?"warning":""}render(){const e=this._maxTitleLength-this._title.length,t=this._maxDescriptionLength-this._description.length;return c`
      <form @submit=${this._handleSubmit}>
        <div class="form-group">
          <label class="required" for="title-input">Task Title</label>
          <input
            id="title-input"
            type="text"
            .value=${this._title}
            @input=${this._handleTitleInput}
            @blur=${this._validateTitle}
            placeholder="What do you need to do?"
            maxlength=${this._maxTitleLength+10}
          />
          <div class="char-count ${this._getTitleCharCountClass()}">
            ${e} characters remaining
          </div>
          ${this._titleError?c`<div class="error-message">${this._titleError}</div>`:null}
        </div>

        <div class="form-group">
          <label for="description-input">Description (optional)</label>
          <textarea
            id="description-input"
            .value=${this._description}
            @input=${this._handleDescriptionInput}
            placeholder="Add more details about this task..."
            maxlength=${this._maxDescriptionLength+10}
          ></textarea>
          <div class="char-count ${this._getDescriptionCharCountClass()}">
            ${t} characters remaining
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-cancel"
            @click=${this._handleCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-submit"
            ?disabled=${this._title.trim().length===0}
          >
            ${this.submitLabel}
          </button>
        </div>
      </form>
    `}};k.styles=m`
    :host {
      display: block;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    label.required::after {
      content: " *";
      color: #ef4444;
    }

    input,
    textarea {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.15s ease;
      background: white;
    }

    input:focus,
    textarea:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    input::placeholder,
    textarea::placeholder {
      color: #9ca3af;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    .char-count {
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
    }

    .char-count.warning {
      color: #f59e0b;
    }

    .char-count.error {
      color: #ef4444;
    }

    .error-message {
      font-size: 12px;
      color: #ef4444;
      margin-top: -8px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .btn-submit {
      background: #ef4444;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }
  `;N([r({type:Object})],k.prototype,"task",2);N([r({type:String})],k.prototype,"submitLabel",2);N([y()],k.prototype,"_title",2);N([y()],k.prototype,"_description",2);N([y()],k.prototype,"_titleError",2);N([$e("#title-input")],k.prototype,"_titleInput",2);k=N([b("task-form")],k);var ps=Object.defineProperty,hs=Object.getOwnPropertyDescriptor,et=(e,t,s,a)=>{for(var i=a>1?void 0:a?hs(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&ps(t,s,i),i};let I=class extends h{constructor(){super(...arguments),this.open=!1,this.isEdit=!1,this._focusedElement=null}_getDialogTitle(){return this.isEdit?"Edit Task":"New Task"}_getDialogSubtitle(){return this.isEdit?"Update the details of your task":"Create a new task to plan your day"}_getSubmitLabel(){return this.isEdit?"Save Changes":"Create Task"}updated(e){e.has("open")&&(this.open?this._focusedElement=document.activeElement:this._focusedElement&&this._focusedElement.focus())}_handleSubmit(e){this.dispatchEvent(new CustomEvent("save",{bubbles:!0,composed:!0,detail:{taskId:this.task?.id,...e.detail}}))}_handleCancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_handleBackdropClick(e){e.target===e.currentTarget&&this._handleCancel()}_handleKeydown(e){e.key==="Escape"&&this._handleCancel()}render(){return c`
      <div
        class="backdrop ${this.open?"open":""}"
        @click=${this._handleBackdropClick}
        @keydown=${this._handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div class="dialog">
          <div class="dialog-header">
            <h2 class="dialog-title" id="dialog-title">
              ${this._getDialogTitle()}
            </h2>
            ${this._getDialogSubtitle()?c`<p class="dialog-subtitle">
                  ${this._getDialogSubtitle()}
                </p>`:null}
          </div>
          <div class="dialog-content">
            <task-form
              .task=${this.task}
              .submitLabel=${this._getSubmitLabel()}
              @submit=${this._handleSubmit}
              @cancel=${this._handleCancel}
            ></task-form>
          </div>
        </div>
      </div>
    `}};I.styles=m`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s ease,
        visibility 0.2s ease;
      padding: 20px;
    }

    .backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .dialog {
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 480px;
      width: 100%;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }

    .backdrop.open .dialog {
      transform: scale(1);
    }

    .dialog-header {
      margin-bottom: 20px;
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .dialog-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0 0 0;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .dialog-content {
      position: relative;
    }
  `;et([r({type:Boolean})],I.prototype,"open",2);et([r({type:Object})],I.prototype,"task",2);et([r({type:Boolean})],I.prototype,"isEdit",2);et([y()],I.prototype,"_focusedElement",2);I=et([b("task-editor-dialog")],I);var us=Object.defineProperty,fs=Object.getOwnPropertyDescriptor,R=(e,t,s,a)=>{for(var i=a>1?void 0:a?fs(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&us(t,s,i),i};let C=class extends h{constructor(){super(...arguments),this.open=!1,this.title="Confirm Action",this.message="Are you sure you want to proceed?",this.confirmText="Delete",this.cancelText="Cancel",this._focusedElement=null}updated(e){e.has("open")&&(this.open?(this._focusedElement=document.activeElement,this._trapFocus()):this._focusedElement&&this._focusedElement.focus())}_trapFocus(){this.renderRoot.querySelector(".btn-confirm")?.focus()}_handleConfirm(){this.dispatchEvent(new CustomEvent("confirm",{bubbles:!0,composed:!0}))}_handleCancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_handleBackdropClick(e){e.target===e.currentTarget&&this._handleCancel()}_handleKeydown(e){e.key==="Escape"&&this._handleCancel()}render(){return c`
      <div
        class="backdrop ${this.open?"open":""}"
        @click=${this._handleBackdropClick}
        @keydown=${this._handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div class="dialog">
          <h2 class="title" id="dialog-title">${this.title}</h2>
          <p class="message" id="dialog-message">${this.message}</p>
          <div class="actions">
            <button class="btn btn-cancel" @click=${this._handleCancel}>
              ${this.cancelText}
            </button>
            <button class="btn btn-confirm" @click=${this._handleConfirm}>
              ${this.confirmText}
            </button>
          </div>
        </div>
      </div>
    `}};C.styles=m`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s ease,
        visibility 0.2s ease;
    }

    .backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .dialog {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }

    .backdrop.open .dialog {
      transform: scale(1);
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 12px 0;
    }

    .message {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .btn-confirm {
      background: #ef4444;
      color: white;
    }

    .btn-confirm:hover {
      background: #dc2626;
    }

    .btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }
  `;R([r({type:Boolean})],C.prototype,"open",2);R([r({type:String})],C.prototype,"title",2);R([r({type:String})],C.prototype,"message",2);R([r({type:String})],C.prototype,"confirmText",2);R([r({type:String})],C.prototype,"cancelText",2);R([y()],C.prototype,"_focusedElement",2);C=R([b("confirm-dialog")],C);var gs=Object.defineProperty,ms=Object.getOwnPropertyDescriptor,S=(e,t,s,a)=>{for(var i=a>1?void 0:a?ms(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&gs(t,s,i),i};let x=class extends h{constructor(){super(...arguments),this.tasks=[],this.remaining=0,this.disabled=!1,this.showTaskDialog=!1,this.showDeleteDialog=!1}_handleAddTask(){this.dispatchEvent(new CustomEvent("open-task-dialog",{bubbles:!0,composed:!0}))}_handleEditTask(e){this.dispatchEvent(new CustomEvent("edit-task",{bubbles:!0,composed:!0,detail:e.detail}))}_handleDeleteTask(e){this.dispatchEvent(new CustomEvent("delete-task",{bubbles:!0,composed:!0,detail:e.detail}))}_handleAddTomato(e){this.dispatchEvent(new CustomEvent("add-tomato",{bubbles:!0,composed:!0,detail:e.detail}))}_handleRemoveTomato(e){this.dispatchEvent(new CustomEvent("remove-tomato",{bubbles:!0,composed:!0,detail:e.detail}))}render(){const e=this.tasks.length;return c`
      <div class="panel-header">
        <div>
          <span class="header-title">Tasks</span>
          ${e>0?c`<span class="header-count">${e} tasks</span>`:null}
        </div>
        <button class="add-btn" @click=${this._handleAddTask}>
          <span>+</span>
          <span>Add Task</span>
        </button>
      </div>

      <div class="panel-content">
        ${e===0?c`
              <div class="empty-container">
                <div class="empty-icon">📝</div>
                <h3 class="empty-title">No tasks yet</h3>
                <p class="empty-description">
                  Add your first task to start planning your day with tomato
                  assignments.
                </p>
                <button class="add-btn" @click=${this._handleAddTask}>
                  <span>+</span>
                  <span>Add Your First Task</span>
                </button>
              </div>
            `:c`
              <task-list
                .tasks=${this.tasks}
                .remaining=${this.remaining}
                .disabled=${this.disabled}
                @edit-task=${this._handleEditTask}
                @delete-task=${this._handleDeleteTask}
                @add-tomato=${this._handleAddTomato}
                @remove-tomato=${this._handleRemoveTomato}
              ></task-list>
            `}
      </div>
    `}};x.styles=m`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .header-count {
      font-size: 12px;
      color: #9ca3af;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .add-btn:hover {
      background: #dc2626;
    }

    .add-btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 8px 0;
    }

    .empty-description {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px 0;
      text-align: center;
      max-width: 280px;
    }
  `;S([r({type:Array})],x.prototype,"tasks",2);S([r({type:Number})],x.prototype,"remaining",2);S([r({type:Boolean})],x.prototype,"disabled",2);S([r({type:Object})],x.prototype,"editingTask",2);S([r({type:String})],x.prototype,"deletingTaskId",2);S([r({type:Boolean})],x.prototype,"showTaskDialog",2);S([r({type:Boolean})],x.prototype,"showDeleteDialog",2);x=S([b("task-list-panel")],x);var bs=Object.defineProperty,ys=Object.getOwnPropertyDescriptor,$=(e,t,s,a)=>{for(var i=a>1?void 0:a?ys(t,s):t,o=e.length-1,n;o>=0;o--)(n=e[o])&&(i=(a?n(t,s,i):n(i))||i);return a&&i&&bs(t,s,i),i};let v=class extends h{constructor(){super(...arguments),this._capacity=8,this._assigned=0,this._remaining=8,this._tasks=[],this._currentDate="",this._showTaskDialog=!1,this._editingTask=void 0,this._showDeleteDialog=!1,this._deletingTaskId=void 0,this._unsubscribe=null}connectedCallback(){super.connectedCallback(),this._unsubscribe=_.subscribe(e=>{this._capacity=e.pool.dailyCapacity,this._assigned=_.assignedTomatoes,this._remaining=_.remainingTomatoes,this._tasks=e.tasks,this._currentDate=e.pool.date})}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribe&&this._unsubscribe()}_handleCapacityChange(e){_.setCapacity(e.detail.capacity)}_handleOpenTaskDialog(){this._editingTask=void 0,this._showTaskDialog=!0}_handleEditTask(e){const t=_.getTaskById(e.detail.taskId);t&&(this._editingTask=t,this._showTaskDialog=!0)}_handleSaveTask(e){const{taskId:t,title:s,description:a}=e.detail;t?_.updateTask(t,{title:s,description:a}):_.addTask(s,a),this._closeTaskDialog()}_closeTaskDialog(){this._showTaskDialog=!1,this._editingTask=void 0}_handleDeleteTask(e){this._deletingTaskId=e.detail.taskId,this._showDeleteDialog=!0}_handleConfirmDelete(){this._deletingTaskId&&_.removeTask(this._deletingTaskId),this._closeDeleteDialog()}_closeDeleteDialog(){this._showDeleteDialog=!1,this._deletingTaskId=void 0}_handleAddTomato(e){_.assignTomato(e.detail.taskId)}_handleRemoveTomato(e){_.unassignTomato(e.detail.taskId)}_handleResetDay(){_.resetDay()}render(){const e=!!this._editingTask,t=this._deletingTaskId?this._tasks.find(s=>s.id===this._deletingTaskId):void 0;return c`
      <app-shell>
        <app-header
          slot="header"
          .currentDate=${this._currentDate}
          .showReset=${!0}
          @reset-day=${this._handleResetDay}
        ></app-header>

        <tomato-pool-panel
          slot="pool-panel"
          .capacity=${this._capacity}
          .assigned=${this._assigned}
          .remaining=${this._remaining}
          .taskCount=${this._tasks.length}
          @capacity-change=${this._handleCapacityChange}
        ></tomato-pool-panel>

        <task-list-panel
          slot="task-panel"
          .tasks=${this._tasks}
          .remaining=${this._remaining}
          .disabled=${!1}
          @open-task-dialog=${this._handleOpenTaskDialog}
          @edit-task=${this._handleEditTask}
          @delete-task=${this._handleDeleteTask}
          @add-tomato=${this._handleAddTomato}
          @remove-tomato=${this._handleRemoveTomato}
        ></task-list-panel>
      </app-shell>

      <!-- Task Editor Dialog -->
      <task-editor-dialog
        .open=${this._showTaskDialog}
        .task=${this._editingTask}
        .isEdit=${e}
        @save=${this._handleSaveTask}
        @cancel=${this._closeTaskDialog}
      ></task-editor-dialog>

      <!-- Delete Confirmation Dialog -->
      <confirm-dialog
        .open=${this._showDeleteDialog}
        title="Delete Task"
        .message=${t?`Are you sure you want to delete "${t.title}"? This will also remove ${t.tomatoCount} assigned tomatoes.`:"Are you sure you want to delete this task?"}
        confirmText="Delete"
        @confirm=${this._handleConfirmDelete}
        @cancel=${this._closeDeleteDialog}
      ></confirm-dialog>
    `}};v.styles=m`
    :host {
      display: block;
      height: 100vh;
    }
  `;$([y()],v.prototype,"_capacity",2);$([y()],v.prototype,"_assigned",2);$([y()],v.prototype,"_remaining",2);$([y()],v.prototype,"_tasks",2);$([y()],v.prototype,"_currentDate",2);$([y()],v.prototype,"_showTaskDialog",2);$([y()],v.prototype,"_editingTask",2);$([y()],v.prototype,"_showDeleteDialog",2);$([y()],v.prototype,"_deletingTaskId",2);v=$([b("tomato-planner-app")],v);document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("app");if(!e)throw new Error("App root element not found");const t=document.createElement("tomato-planner-app");e.appendChild(t),console.log("🍅 Tomato Planner initialized")});
