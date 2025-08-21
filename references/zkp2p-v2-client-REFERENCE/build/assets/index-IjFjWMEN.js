const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-mAIs9l9Y.js","assets/lit-element-CRwiKRQV.js","assets/all-wallets-BKhlbcV6.js","assets/arrow-bottom-circle-B_DU6Kx9.js","assets/app-store-BOurmvwa.js","assets/apple-sC9e21SG.js","assets/arrow-bottom-hy0SPgLj.js","assets/arrow-left-RO-3C8eO.js","assets/arrow-right-DPT2sOJF.js","assets/arrow-top-C5g63Hqw.js","assets/bank-bi82m7DH.js","assets/browser-DTwO6BPU.js","assets/card-fRcTAPij.js","assets/checkmark-BMcC-fI1.js","assets/checkmark-bold-Bj7NiOqa.js","assets/chevron-bottom-C2u3erOB.js","assets/chevron-left-COZ3kTa5.js","assets/chevron-right-DvFD4AMS.js","assets/chevron-top-BLFEooY6.js","assets/chrome-store-B_P9qdYt.js","assets/clock-Cwp1S97D.js","assets/close-B8Y6aOzJ.js","assets/compass-Bzt_0391.js","assets/coinPlaceholder-BDsWt56m.js","assets/copy-C8u9Lcb2.js","assets/cursor-Dcpg02cN.js","assets/cursor-transparent-CvafZT1h.js","assets/desktop-BU__Zzqp.js","assets/disconnect-BQ3YJCSs.js","assets/discord-N05VU1Zn.js","assets/etherscan-CBttaxgz.js","assets/extension-Bssxxpq3.js","assets/external-link-7-czpdA0.js","assets/facebook-D0l4tJO1.js","assets/farcaster-rLmL-BQN.js","assets/filters-Dbvsjhg5.js","assets/github-BdfLShVG.js","assets/google-BuqeXpzY.js","assets/help-circle-DsTYTSwH.js","assets/image-BIq1KSzJ.js","assets/id-BeBLNd4S.js","assets/info-circle-Bs4VgyK5.js","assets/lightbulb-ByXsvHdz.js","assets/mail-DRDjhJx8.js","assets/mobile-CNp8QpWE.js","assets/more-CGI4tKO1.js","assets/network-placeholder-DMxgtlV3.js","assets/nftPlaceholder-CgMRS5nu.js","assets/off-Cxbl1Wy3.js","assets/play-store-DtadYBXH.js","assets/plus-BUftPrw0.js","assets/qr-code-CKYzvrLR.js","assets/recycle-horizontal-CXg1h4DQ.js","assets/refresh-Bsw5m-T3.js","assets/search-BxOZFR_k.js","assets/send-BoZC3CxG.js","assets/swapHorizontal-CVmNIJ5Q.js","assets/swapHorizontalMedium-DttSYkLL.js","assets/swapHorizontalBold-BD7XCu-Z.js","assets/swapHorizontalRoundedBold-BLctCsDV.js","assets/swapVertical-DsuQvQ3r.js","assets/telegram-C1T2Vfom.js","assets/three-dots-BKRuaByb.js","assets/twitch-ziNW5Cqf.js","assets/x-CYqxIceP.js","assets/twitterIcon-64bLLM9q.js","assets/verify-BySgo7xY.js","assets/verify-filled--F84u9HT.js","assets/wallet-CiTvGqM4.js","assets/walletconnect-C-O32ffS.js","assets/wallet-placeholder-aHrunRtR.js","assets/warning-circle-Io-BB4Xz.js","assets/info-Cc3WyzA1.js","assets/exclamation-triangle-DOqWdDTL.js","assets/reown-logo-BulcxA0i.js"])))=>i.map(i=>d[i]);
import{i as y,a as S,x as _}from"./lit-element-CRwiKRQV.js";import{n as l,m as C,a as k}from"./class-map-E4R2Eani.js";import{r as E,c as A,e as B}from"./core-CTYGwN58.js";import{dL as e}from"./index-CLls0W8x.js";const w={getSpacingStyles(t,r){if(Array.isArray(t))return t[r]?`var(--wui-spacing-${t[r]})`:void 0;if(typeof t=="string")return`var(--wui-spacing-${t})`},getFormattedDate(t){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t)},getHostName(t){try{return new URL(t).hostname}catch{return""}},getTruncateString({string:t,charsStart:r,charsEnd:i,truncate:a}){return t.length<=r+i?t:a==="end"?`${t.substring(0,r)}...`:a==="start"?`...${t.substring(t.length-i)}`:`${t.substring(0,Math.floor(r))}...${t.substring(t.length-Math.floor(i))}`},generateAvatarColors(t){const i=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),a=this.hexToRgb(i),n=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),s=100-3*Number(n?.replace("px","")),c=`${s}% ${s}% at 65% 40%`,v=[];for(let h=0;h<5;h+=1){const O=this.tintColor(a,.15*h);v.push(`rgb(${O[0]}, ${O[1]}, ${O[2]})`)}return`
    --local-color-1: ${v[0]};
    --local-color-2: ${v[1]};
    --local-color-3: ${v[2]};
    --local-color-4: ${v[3]};
    --local-color-5: ${v[4]};
    --local-radial-circle: ${c}
   `},hexToRgb(t){const r=parseInt(t,16),i=r>>16&255,a=r>>8&255,n=r&255;return[i,a,n]},tintColor(t,r){const[i,a,n]=t,o=Math.round(i+(255-i)*r),s=Math.round(a+(255-a)*r),c=Math.round(n+(255-n)*r);return[o,s,c]},isNumber(t){return{number:/^[0-9]+$/u}.number.test(t)},getColorTheme(t){return t||(typeof window<"u"&&window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)")?.matches?"dark":"light":"dark")},splitBalance(t){const r=t.split(".");return r.length===2?[r[0],r[1]]:["0","00"]},roundNumber(t,r,i){return t.toString().length>=r?Number(t).toFixed(i):t},formatNumberToLocalString(t,r=2){return t===void 0?"0.00":typeof t=="number"?t.toLocaleString("en-US",{maximumFractionDigits:r,minimumFractionDigits:r}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:r,minimumFractionDigits:r})}};function j(t,r){const{kind:i,elements:a}=r;return{kind:i,elements:a,finisher(n){customElements.get(t)||customElements.define(t,n)}}}function W(t,r){return customElements.get(t)||customElements.define(t,r),r}function b(t){return function(i){return typeof i=="function"?W(t,i):j(t,i)}}const H=y`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var d=function(t,r,i,a){var n=arguments.length,o=n<3?r:a===null?a=Object.getOwnPropertyDescriptor(r,i):a,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,r,i,a);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(r,i,o):s(r,i))||o);return n>3&&o&&Object.defineProperty(r,i,o),o};let u=class extends S{render(){return this.style.cssText=`
      flex-direction: ${this.flexDirection};
      flex-wrap: ${this.flexWrap};
      flex-basis: ${this.flexBasis};
      flex-grow: ${this.flexGrow};
      flex-shrink: ${this.flexShrink};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&w.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&w.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&w.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&w.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&w.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&w.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&w.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&w.getSpacingStyles(this.margin,3)};
    `,_`<slot></slot>`}};u.styles=[E,H];d([l()],u.prototype,"flexDirection",void 0);d([l()],u.prototype,"flexWrap",void 0);d([l()],u.prototype,"flexBasis",void 0);d([l()],u.prototype,"flexGrow",void 0);d([l()],u.prototype,"flexShrink",void 0);d([l()],u.prototype,"alignItems",void 0);d([l()],u.prototype,"justifyContent",void 0);d([l()],u.prototype,"columnGap",void 0);d([l()],u.prototype,"rowGap",void 0);d([l()],u.prototype,"gap",void 0);d([l()],u.prototype,"padding",void 0);d([l()],u.prototype,"margin",void 0);u=d([b("wui-flex")],u);class F{constructor(){this.cache=new Map}set(r,i){this.cache.set(r,i)}get(r){return this.cache.get(r)}has(r){return this.cache.has(r)}delete(r){this.cache.delete(r)}clear(){this.cache.clear()}}const D=new F,M=y`
  :host {
    display: flex;
    aspect-ratio: var(--local-aspect-ratio);
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    width: inherit;
    height: inherit;
    object-fit: contain;
    object-position: center;
  }

  .fallback {
    width: var(--local-width);
    height: var(--local-height);
  }
`;var T=function(t,r,i,a){var n=arguments.length,o=n<3?r:a,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,r,i,a);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(r,i,o):s(r,i))||o);return n>3&&o&&Object.defineProperty(r,i,o),o};const z={add:async()=>(await e(async()=>{const{addSvg:t}=await import("./add-mAIs9l9Y.js");return{addSvg:t}},__vite__mapDeps([0,1]))).addSvg,allWallets:async()=>(await e(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-BKhlbcV6.js");return{allWalletsSvg:t}},__vite__mapDeps([2,1]))).allWalletsSvg,arrowBottomCircle:async()=>(await e(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-B_DU6Kx9.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([3,1]))).arrowBottomCircleSvg,appStore:async()=>(await e(async()=>{const{appStoreSvg:t}=await import("./app-store-BOurmvwa.js");return{appStoreSvg:t}},__vite__mapDeps([4,1]))).appStoreSvg,apple:async()=>(await e(async()=>{const{appleSvg:t}=await import("./apple-sC9e21SG.js");return{appleSvg:t}},__vite__mapDeps([5,1]))).appleSvg,arrowBottom:async()=>(await e(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-hy0SPgLj.js");return{arrowBottomSvg:t}},__vite__mapDeps([6,1]))).arrowBottomSvg,arrowLeft:async()=>(await e(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-RO-3C8eO.js");return{arrowLeftSvg:t}},__vite__mapDeps([7,1]))).arrowLeftSvg,arrowRight:async()=>(await e(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-DPT2sOJF.js");return{arrowRightSvg:t}},__vite__mapDeps([8,1]))).arrowRightSvg,arrowTop:async()=>(await e(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-C5g63Hqw.js");return{arrowTopSvg:t}},__vite__mapDeps([9,1]))).arrowTopSvg,bank:async()=>(await e(async()=>{const{bankSvg:t}=await import("./bank-bi82m7DH.js");return{bankSvg:t}},__vite__mapDeps([10,1]))).bankSvg,browser:async()=>(await e(async()=>{const{browserSvg:t}=await import("./browser-DTwO6BPU.js");return{browserSvg:t}},__vite__mapDeps([11,1]))).browserSvg,card:async()=>(await e(async()=>{const{cardSvg:t}=await import("./card-fRcTAPij.js");return{cardSvg:t}},__vite__mapDeps([12,1]))).cardSvg,checkmark:async()=>(await e(async()=>{const{checkmarkSvg:t}=await import("./checkmark-BMcC-fI1.js");return{checkmarkSvg:t}},__vite__mapDeps([13,1]))).checkmarkSvg,checkmarkBold:async()=>(await e(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-Bj7NiOqa.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([14,1]))).checkmarkBoldSvg,chevronBottom:async()=>(await e(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-C2u3erOB.js");return{chevronBottomSvg:t}},__vite__mapDeps([15,1]))).chevronBottomSvg,chevronLeft:async()=>(await e(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-COZ3kTa5.js");return{chevronLeftSvg:t}},__vite__mapDeps([16,1]))).chevronLeftSvg,chevronRight:async()=>(await e(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-DvFD4AMS.js");return{chevronRightSvg:t}},__vite__mapDeps([17,1]))).chevronRightSvg,chevronTop:async()=>(await e(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-BLFEooY6.js");return{chevronTopSvg:t}},__vite__mapDeps([18,1]))).chevronTopSvg,chromeStore:async()=>(await e(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-B_P9qdYt.js");return{chromeStoreSvg:t}},__vite__mapDeps([19,1]))).chromeStoreSvg,clock:async()=>(await e(async()=>{const{clockSvg:t}=await import("./clock-Cwp1S97D.js");return{clockSvg:t}},__vite__mapDeps([20,1]))).clockSvg,close:async()=>(await e(async()=>{const{closeSvg:t}=await import("./close-B8Y6aOzJ.js");return{closeSvg:t}},__vite__mapDeps([21,1]))).closeSvg,compass:async()=>(await e(async()=>{const{compassSvg:t}=await import("./compass-Bzt_0391.js");return{compassSvg:t}},__vite__mapDeps([22,1]))).compassSvg,coinPlaceholder:async()=>(await e(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-BDsWt56m.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([23,1]))).coinPlaceholderSvg,copy:async()=>(await e(async()=>{const{copySvg:t}=await import("./copy-C8u9Lcb2.js");return{copySvg:t}},__vite__mapDeps([24,1]))).copySvg,cursor:async()=>(await e(async()=>{const{cursorSvg:t}=await import("./cursor-Dcpg02cN.js");return{cursorSvg:t}},__vite__mapDeps([25,1]))).cursorSvg,cursorTransparent:async()=>(await e(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-CvafZT1h.js");return{cursorTransparentSvg:t}},__vite__mapDeps([26,1]))).cursorTransparentSvg,desktop:async()=>(await e(async()=>{const{desktopSvg:t}=await import("./desktop-BU__Zzqp.js");return{desktopSvg:t}},__vite__mapDeps([27,1]))).desktopSvg,disconnect:async()=>(await e(async()=>{const{disconnectSvg:t}=await import("./disconnect-BQ3YJCSs.js");return{disconnectSvg:t}},__vite__mapDeps([28,1]))).disconnectSvg,discord:async()=>(await e(async()=>{const{discordSvg:t}=await import("./discord-N05VU1Zn.js");return{discordSvg:t}},__vite__mapDeps([29,1]))).discordSvg,etherscan:async()=>(await e(async()=>{const{etherscanSvg:t}=await import("./etherscan-CBttaxgz.js");return{etherscanSvg:t}},__vite__mapDeps([30,1]))).etherscanSvg,extension:async()=>(await e(async()=>{const{extensionSvg:t}=await import("./extension-Bssxxpq3.js");return{extensionSvg:t}},__vite__mapDeps([31,1]))).extensionSvg,externalLink:async()=>(await e(async()=>{const{externalLinkSvg:t}=await import("./external-link-7-czpdA0.js");return{externalLinkSvg:t}},__vite__mapDeps([32,1]))).externalLinkSvg,facebook:async()=>(await e(async()=>{const{facebookSvg:t}=await import("./facebook-D0l4tJO1.js");return{facebookSvg:t}},__vite__mapDeps([33,1]))).facebookSvg,farcaster:async()=>(await e(async()=>{const{farcasterSvg:t}=await import("./farcaster-rLmL-BQN.js");return{farcasterSvg:t}},__vite__mapDeps([34,1]))).farcasterSvg,filters:async()=>(await e(async()=>{const{filtersSvg:t}=await import("./filters-Dbvsjhg5.js");return{filtersSvg:t}},__vite__mapDeps([35,1]))).filtersSvg,github:async()=>(await e(async()=>{const{githubSvg:t}=await import("./github-BdfLShVG.js");return{githubSvg:t}},__vite__mapDeps([36,1]))).githubSvg,google:async()=>(await e(async()=>{const{googleSvg:t}=await import("./google-BuqeXpzY.js");return{googleSvg:t}},__vite__mapDeps([37,1]))).googleSvg,helpCircle:async()=>(await e(async()=>{const{helpCircleSvg:t}=await import("./help-circle-DsTYTSwH.js");return{helpCircleSvg:t}},__vite__mapDeps([38,1]))).helpCircleSvg,image:async()=>(await e(async()=>{const{imageSvg:t}=await import("./image-BIq1KSzJ.js");return{imageSvg:t}},__vite__mapDeps([39,1]))).imageSvg,id:async()=>(await e(async()=>{const{idSvg:t}=await import("./id-BeBLNd4S.js");return{idSvg:t}},__vite__mapDeps([40,1]))).idSvg,infoCircle:async()=>(await e(async()=>{const{infoCircleSvg:t}=await import("./info-circle-Bs4VgyK5.js");return{infoCircleSvg:t}},__vite__mapDeps([41,1]))).infoCircleSvg,lightbulb:async()=>(await e(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-ByXsvHdz.js");return{lightbulbSvg:t}},__vite__mapDeps([42,1]))).lightbulbSvg,mail:async()=>(await e(async()=>{const{mailSvg:t}=await import("./mail-DRDjhJx8.js");return{mailSvg:t}},__vite__mapDeps([43,1]))).mailSvg,mobile:async()=>(await e(async()=>{const{mobileSvg:t}=await import("./mobile-CNp8QpWE.js");return{mobileSvg:t}},__vite__mapDeps([44,1]))).mobileSvg,more:async()=>(await e(async()=>{const{moreSvg:t}=await import("./more-CGI4tKO1.js");return{moreSvg:t}},__vite__mapDeps([45,1]))).moreSvg,networkPlaceholder:async()=>(await e(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-DMxgtlV3.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([46,1]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await e(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-CgMRS5nu.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([47,1]))).nftPlaceholderSvg,off:async()=>(await e(async()=>{const{offSvg:t}=await import("./off-Cxbl1Wy3.js");return{offSvg:t}},__vite__mapDeps([48,1]))).offSvg,playStore:async()=>(await e(async()=>{const{playStoreSvg:t}=await import("./play-store-DtadYBXH.js");return{playStoreSvg:t}},__vite__mapDeps([49,1]))).playStoreSvg,plus:async()=>(await e(async()=>{const{plusSvg:t}=await import("./plus-BUftPrw0.js");return{plusSvg:t}},__vite__mapDeps([50,1]))).plusSvg,qrCode:async()=>(await e(async()=>{const{qrCodeIcon:t}=await import("./qr-code-CKYzvrLR.js");return{qrCodeIcon:t}},__vite__mapDeps([51,1]))).qrCodeIcon,recycleHorizontal:async()=>(await e(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-CXg1h4DQ.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([52,1]))).recycleHorizontalSvg,refresh:async()=>(await e(async()=>{const{refreshSvg:t}=await import("./refresh-Bsw5m-T3.js");return{refreshSvg:t}},__vite__mapDeps([53,1]))).refreshSvg,search:async()=>(await e(async()=>{const{searchSvg:t}=await import("./search-BxOZFR_k.js");return{searchSvg:t}},__vite__mapDeps([54,1]))).searchSvg,send:async()=>(await e(async()=>{const{sendSvg:t}=await import("./send-BoZC3CxG.js");return{sendSvg:t}},__vite__mapDeps([55,1]))).sendSvg,swapHorizontal:async()=>(await e(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-CVmNIJ5Q.js");return{swapHorizontalSvg:t}},__vite__mapDeps([56,1]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await e(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-DttSYkLL.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([57,1]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await e(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-BD7XCu-Z.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([58,1]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await e(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-BLctCsDV.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([59,1]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await e(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-DsuQvQ3r.js");return{swapVerticalSvg:t}},__vite__mapDeps([60,1]))).swapVerticalSvg,telegram:async()=>(await e(async()=>{const{telegramSvg:t}=await import("./telegram-C1T2Vfom.js");return{telegramSvg:t}},__vite__mapDeps([61,1]))).telegramSvg,threeDots:async()=>(await e(async()=>{const{threeDotsSvg:t}=await import("./three-dots-BKRuaByb.js");return{threeDotsSvg:t}},__vite__mapDeps([62,1]))).threeDotsSvg,twitch:async()=>(await e(async()=>{const{twitchSvg:t}=await import("./twitch-ziNW5Cqf.js");return{twitchSvg:t}},__vite__mapDeps([63,1]))).twitchSvg,twitter:async()=>(await e(async()=>{const{xSvg:t}=await import("./x-CYqxIceP.js");return{xSvg:t}},__vite__mapDeps([64,1]))).xSvg,twitterIcon:async()=>(await e(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-64bLLM9q.js");return{twitterIconSvg:t}},__vite__mapDeps([65,1]))).twitterIconSvg,verify:async()=>(await e(async()=>{const{verifySvg:t}=await import("./verify-BySgo7xY.js");return{verifySvg:t}},__vite__mapDeps([66,1]))).verifySvg,verifyFilled:async()=>(await e(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled--F84u9HT.js");return{verifyFilledSvg:t}},__vite__mapDeps([67,1]))).verifyFilledSvg,wallet:async()=>(await e(async()=>{const{walletSvg:t}=await import("./wallet-CiTvGqM4.js");return{walletSvg:t}},__vite__mapDeps([68,1]))).walletSvg,walletConnect:async()=>(await e(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-C-O32ffS.js");return{walletConnectSvg:t}},__vite__mapDeps([69,1]))).walletConnectSvg,walletConnectLightBrown:async()=>(await e(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-C-O32ffS.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([69,1]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await e(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-C-O32ffS.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([69,1]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await e(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-aHrunRtR.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([70,1]))).walletPlaceholderSvg,warningCircle:async()=>(await e(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-Io-BB4Xz.js");return{warningCircleSvg:t}},__vite__mapDeps([71,1]))).warningCircleSvg,x:async()=>(await e(async()=>{const{xSvg:t}=await import("./x-CYqxIceP.js");return{xSvg:t}},__vite__mapDeps([64,1]))).xSvg,info:async()=>(await e(async()=>{const{infoSvg:t}=await import("./info-Cc3WyzA1.js");return{infoSvg:t}},__vite__mapDeps([72,1]))).infoSvg,exclamationTriangle:async()=>(await e(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-DOqWdDTL.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([73,1]))).exclamationTriangleSvg,reown:async()=>(await e(async()=>{const{reownSvg:t}=await import("./reown-logo-BulcxA0i.js");return{reownSvg:t}},__vite__mapDeps([74,1]))).reownSvg};async function G(t){if(D.has(t))return D.get(t);const i=(z[t]??z.copy)();return D.set(t,i),i}let f=class extends S{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `,_`${C(G(this.name),_`<div class="fallback"></div>`)}`}};f.styles=[E,A,M];T([l()],f.prototype,"size",void 0);T([l()],f.prototype,"name",void 0);T([l()],f.prototype,"color",void 0);T([l()],f.prototype,"aspectRatio",void 0);f=T([b("wui-icon")],f);const U=y`
  :host {
    display: inline-flex !important;
  }

  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    font-family: var(--wui-font-family);
    font-feature-settings:
      'tnum' on,
      'lnum' on,
      'case' on;
    line-height: 130%;
    font-weight: var(--wui-font-weight-regular);
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .wui-font-medium-400 {
    font-size: var(--wui-font-size-medium);
    font-weight: var(--wui-font-weight-light);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-medium-600 {
    font-size: var(--wui-font-size-medium);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-title-600 {
    font-size: var(--wui-font-size-title);
    letter-spacing: var(--wui-letter-spacing-title);
  }

  .wui-font-title-6-600 {
    font-size: var(--wui-font-size-title-6);
    letter-spacing: var(--wui-letter-spacing-title-6);
  }

  .wui-font-mini-700 {
    font-size: var(--wui-font-size-mini);
    letter-spacing: var(--wui-letter-spacing-mini);
    text-transform: uppercase;
  }

  .wui-font-large-500,
  .wui-font-large-600,
  .wui-font-large-700 {
    font-size: var(--wui-font-size-large);
    letter-spacing: var(--wui-letter-spacing-large);
  }

  .wui-font-2xl-500,
  .wui-font-2xl-600,
  .wui-font-2xl-700 {
    font-size: var(--wui-font-size-2xl);
    letter-spacing: var(--wui-letter-spacing-2xl);
  }

  .wui-font-paragraph-400,
  .wui-font-paragraph-500,
  .wui-font-paragraph-600,
  .wui-font-paragraph-700 {
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
  }

  .wui-font-small-400,
  .wui-font-small-500,
  .wui-font-small-600 {
    font-size: var(--wui-font-size-small);
    letter-spacing: var(--wui-letter-spacing-small);
  }

  .wui-font-tiny-400,
  .wui-font-tiny-500,
  .wui-font-tiny-600 {
    font-size: var(--wui-font-size-tiny);
    letter-spacing: var(--wui-letter-spacing-tiny);
  }

  .wui-font-micro-700,
  .wui-font-micro-600 {
    font-size: var(--wui-font-size-micro);
    letter-spacing: var(--wui-letter-spacing-micro);
    text-transform: uppercase;
  }

  .wui-font-tiny-400,
  .wui-font-small-400,
  .wui-font-medium-400,
  .wui-font-paragraph-400 {
    font-weight: var(--wui-font-weight-light);
  }

  .wui-font-large-700,
  .wui-font-paragraph-700,
  .wui-font-micro-700,
  .wui-font-mini-700 {
    font-weight: var(--wui-font-weight-bold);
  }

  .wui-font-medium-600,
  .wui-font-medium-title-600,
  .wui-font-title-6-600,
  .wui-font-large-600,
  .wui-font-paragraph-600,
  .wui-font-small-600,
  .wui-font-tiny-600,
  .wui-font-micro-600 {
    font-weight: var(--wui-font-weight-medium);
  }

  :host([disabled]) {
    opacity: 0.4;
  }
`;var L=function(t,r,i,a){var n=arguments.length,o=n<3?r:a===null?a=Object.getOwnPropertyDescriptor(r,i):a,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,r,i,a);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(r,i,o):s(r,i))||o);return n>3&&o&&Object.defineProperty(r,i,o),o};let m=class extends S{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const r={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `,_`<slot class=${k(r)}></slot>`}};m.styles=[E,U];L([l()],m.prototype,"variant",void 0);L([l()],m.prototype,"color",void 0);L([l()],m.prototype,"align",void 0);L([l()],m.prototype,"lineClamp",void 0);m=L([b("wui-text")],m);const N=y`
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    background-color: var(--wui-color-gray-glass-020);
    border-radius: var(--local-border-radius);
    border: var(--local-border);
    box-sizing: content-box;
    width: var(--local-size);
    height: var(--local-size);
    min-height: var(--local-size);
    min-width: var(--local-size);
  }

  @supports (background: color-mix(in srgb, white 50%, black)) {
    :host {
      background-color: color-mix(in srgb, var(--local-bg-value) var(--local-bg-mix), transparent);
    }
  }
`;var p=function(t,r,i,a){var n=arguments.length,o=n<3?r:a===null?a=Object.getOwnPropertyDescriptor(r,i):a,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,r,i,a);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(r,i,o):s(r,i))||o);return n>3&&o&&Object.defineProperty(r,i,o),o};let g=class extends S{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const r=this.iconSize||this.size,i=this.size==="lg",a=this.size==="xl",n=i?"12%":"16%",o=i?"xxs":a?"s":"3xl",s=this.background==="gray",c=this.background==="opaque",v=this.backgroundColor==="accent-100"&&c||this.backgroundColor==="success-100"&&c||this.backgroundColor==="error-100"&&c||this.backgroundColor==="inverse-100"&&c;let h=`var(--wui-color-${this.backgroundColor})`;return v?h=`var(--wui-icon-box-bg-${this.backgroundColor})`:s&&(h=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`
       --local-bg-value: ${h};
       --local-bg-mix: ${v||s?"100%":n};
       --local-border-radius: var(--wui-border-radius-${o});
       --local-size: var(--wui-icon-box-size-${this.size});
       --local-border: ${this.borderColor==="wui-color-bg-125"?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}
   `,_` <wui-icon color=${this.iconColor} size=${r} name=${this.icon}></wui-icon> `}};g.styles=[E,B,N];p([l()],g.prototype,"size",void 0);p([l()],g.prototype,"backgroundColor",void 0);p([l()],g.prototype,"iconColor",void 0);p([l()],g.prototype,"iconSize",void 0);p([l()],g.prototype,"background",void 0);p([l({type:Boolean})],g.prototype,"border",void 0);p([l()],g.prototype,"borderColor",void 0);p([l()],g.prototype,"icon",void 0);g=p([b("wui-icon-box")],g);const q=y`
  :host {
    display: block;
    width: var(--local-width);
    height: var(--local-height);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    border-radius: inherit;
  }
`;var I=function(t,r,i,a){var n=arguments.length,o=n<3?r:a===null?a=Object.getOwnPropertyDescriptor(r,i):a,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,r,i,a);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(r,i,o):s(r,i))||o);return n>3&&o&&Object.defineProperty(r,i,o),o};let x=class extends S{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`
      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      `,_`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};x.styles=[E,A,q];I([l()],x.prototype,"src",void 0);I([l()],x.prototype,"alt",void 0);I([l()],x.prototype,"size",void 0);x=I([b("wui-image")],x);const Y=y`
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
`;var $=function(t,r,i,a){var n=arguments.length,o=n<3?r:a===null?a=Object.getOwnPropertyDescriptor(r,i):a,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,r,i,a);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(r,i,o):s(r,i))||o);return n>3&&o&&Object.defineProperty(r,i,o),o};let R=class extends S{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const r=this.size==="md"?"mini-700":"micro-700";return _`
      <wui-text data-variant=${this.variant} variant=${r} color="inherit">
        <slot></slot>
      </wui-text>
    `}};R.styles=[E,Y];$([l()],R.prototype,"variant",void 0);$([l()],R.prototype,"size",void 0);R=$([b("wui-tag")],R);const X=y`
  :host {
    display: flex;
  }

  :host([data-size='sm']) > svg {
    width: 12px;
    height: 12px;
  }

  :host([data-size='md']) > svg {
    width: 16px;
    height: 16px;
  }

  :host([data-size='lg']) > svg {
    width: 24px;
    height: 24px;
  }

  :host([data-size='xl']) > svg {
    width: 32px;
    height: 32px;
  }

  svg {
    animation: rotate 2s linear infinite;
  }

  circle {
    fill: none;
    stroke: var(--local-color);
    stroke-width: 4px;
    stroke-dasharray: 1, 124;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  :host([data-size='md']) > svg > circle {
    stroke-width: 6px;
  }

  :host([data-size='sm']) > svg > circle {
    stroke-width: 8px;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 124;
      stroke-dashoffset: 0;
    }

    50% {
      stroke-dasharray: 90, 124;
      stroke-dashoffset: -35;
    }

    100% {
      stroke-dashoffset: -125;
    }
  }
`;var V=function(t,r,i,a){var n=arguments.length,o=n<3?r:a===null?a=Object.getOwnPropertyDescriptor(r,i):a,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,r,i,a);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(r,i,o):s(r,i))||o);return n>3&&o&&Object.defineProperty(r,i,o),o};let P=class extends S{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText=`--local-color: ${this.color==="inherit"?"inherit":`var(--wui-color-${this.color})`}`,this.dataset.size=this.size,_`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};P.styles=[E,X];V([l()],P.prototype,"color",void 0);V([l()],P.prototype,"size",void 0);P=V([b("wui-loading-spinner")],P);export{w as U,b as c};
