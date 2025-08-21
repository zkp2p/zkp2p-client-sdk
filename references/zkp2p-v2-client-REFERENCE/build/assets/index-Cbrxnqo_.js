const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-DQRtCOZZ.js","assets/lit-element-CRwiKRQV.js","assets/all-wallets-CCq2jbv2.js","assets/arrow-bottom-circle-DR3peI7W.js","assets/app-store-CioN5oda.js","assets/apple-moubl183.js","assets/arrow-bottom-D2wZUJfK.js","assets/arrow-left-C7ChVx6M.js","assets/arrow-right-C0tnBMb8.js","assets/arrow-top-BzPpz9C3.js","assets/bank-DafQd8kc.js","assets/browser-CaN7fVIq.js","assets/bin-BVGNIRAo.js","assets/bitcoin-uAkOmrnZ.js","assets/card-BGGtOKrJ.js","assets/checkmark-CNW3jbqF.js","assets/checkmark-bold-C9_kWVys.js","assets/chevron-bottom-CnNCGtmR.js","assets/chevron-left-CcL1sMyJ.js","assets/chevron-right-N_t5Riga.js","assets/chevron-top-BcXnm8KL.js","assets/chrome-store-igC6NKGV.js","assets/clock-GBY-45XZ.js","assets/close-Clu0PiQZ.js","assets/compass-zaTftaRT.js","assets/coinPlaceholder-B1LDi0hS.js","assets/copy-TrUqi6oc.js","assets/cursor-CQGj65SP.js","assets/cursor-transparent-CEpDH82W.js","assets/circle-Cj8Wknt6.js","assets/desktop-DRaqcaC0.js","assets/disconnect-SOo6ySVK.js","assets/discord-CKGtex_z.js","assets/ethereum-BpWQM075.js","assets/etherscan-CIt0U143.js","assets/extension-B6Wcmj-K.js","assets/external-link-WaS1F0X0.js","assets/facebook-D-bOtqNJ.js","assets/farcaster-tXsqPPNi.js","assets/filters-CdM_eISy.js","assets/github-uZJf1t3J.js","assets/google-CAf_eygs.js","assets/help-circle-B2fApfZ6.js","assets/image-k8C1dfZ9.js","assets/id-Bql5EUvv.js","assets/info-circle-GL2u8tdm.js","assets/lightbulb-wDFWfHob.js","assets/mail-CDE-kzlb.js","assets/mobile-CccdpqIr.js","assets/more-CZh9FHJr.js","assets/network-placeholder-CoI0AdBc.js","assets/nftPlaceholder-DuA9XC84.js","assets/off-DS_5cqGY.js","assets/play-store-j2NWp90J.js","assets/plus-Xv-JYzDu.js","assets/qr-code-B7lGiCRa.js","assets/recycle-horizontal-BbNbOPUG.js","assets/refresh-CJOVDg--.js","assets/search-BqIc4Z9D.js","assets/send-mNT5B-aI.js","assets/swapHorizontal-D8B8HIk2.js","assets/swapHorizontalMedium-U0H6R4Vv.js","assets/swapHorizontalBold-CVkvbxx_.js","assets/swapHorizontalRoundedBold-Clw1XwLw.js","assets/swapVertical-dujHueTF.js","assets/solana-KISekc8K.js","assets/telegram-Ci5N-ikQ.js","assets/three-dots-zr8GiXao.js","assets/twitch-BMHmf4S7.js","assets/x-BXu1IXWM.js","assets/twitterIcon-BELNG64c.js","assets/verify-MN3aNET3.js","assets/verify-filled-CsfYERry.js","assets/wallet-D3y9SECi.js","assets/walletconnect-DxWLcJsn.js","assets/wallet-placeholder-Bi82AGqW.js","assets/warning-circle-B94wc9I_.js","assets/info-BAKMuBzo.js","assets/exclamation-triangle-DjmPTT1d.js","assets/reown-logo-DTQc2HJ5.js","assets/x-mark-DQ5cmAwU.js"])))=>i.map(i=>d[i]);
import{dL as a}from"./index-CLls0W8x.js";import{i as E,a as R,x as y}from"./lit-element-CRwiKRQV.js";import{n as s,m as I,a as D}from"./class-map-E4R2Eani.js";import{r as T,c as O}from"./index-Bcpr83TD.js";const w={getSpacingStyles(t,i){if(Array.isArray(t))return t[i]?`var(--wui-spacing-${t[i]})`:void 0;if(typeof t=="string")return`var(--wui-spacing-${t})`},getFormattedDate(t){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t)},getHostName(t){try{return new URL(t).hostname}catch{return""}},getTruncateString({string:t,charsStart:i,charsEnd:r,truncate:o}){return t.length<=i+r?t:o==="end"?`${t.substring(0,i)}...`:o==="start"?`...${t.substring(t.length-r)}`:`${t.substring(0,Math.floor(i))}...${t.substring(t.length-Math.floor(r))}`},generateAvatarColors(t){const r=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),o=this.hexToRgb(r),n=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),c=100-3*Number(n?.replace("px","")),l=`${c}% ${c}% at 65% 40%`,p=[];for(let f=0;f<5;f+=1){const h=this.tintColor(o,.15*f);p.push(`rgb(${h[0]}, ${h[1]}, ${h[2]})`)}return`
    --local-color-1: ${p[0]};
    --local-color-2: ${p[1]};
    --local-color-3: ${p[2]};
    --local-color-4: ${p[3]};
    --local-color-5: ${p[4]};
    --local-radial-circle: ${l}
   `},hexToRgb(t){const i=parseInt(t,16),r=i>>16&255,o=i>>8&255,n=i&255;return[r,o,n]},tintColor(t,i){const[r,o,n]=t,e=Math.round(r+(255-r)*i),c=Math.round(o+(255-o)*i),l=Math.round(n+(255-n)*i);return[e,c,l]},isNumber(t){return{number:/^[0-9]+$/u}.number.test(t)},getColorTheme(t){return t||(typeof window<"u"&&window.matchMedia&&typeof window.matchMedia=="function"?window.matchMedia("(prefers-color-scheme: dark)")?.matches?"dark":"light":"dark")},splitBalance(t){const i=t.split(".");return i.length===2?[i[0],i[1]]:["0","00"]},roundNumber(t,i,r){return t.toString().length>=i?Number(t).toFixed(r):t},formatNumberToLocalString(t,i=2){return t===void 0?"0.00":typeof t=="number"?t.toLocaleString("en-US",{maximumFractionDigits:i,minimumFractionDigits:i}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:i,minimumFractionDigits:i})}};function V(t,i){const{kind:r,elements:o}=i;return{kind:r,elements:o,finisher(n){customElements.get(t)||customElements.define(t,n)}}}function A(t,i){return customElements.get(t)||customElements.define(t,i),i}function P(t){return function(r){return typeof r=="function"?A(t,r):V(t,r)}}class b{constructor(){this.cache=new Map}set(i,r){this.cache.set(i,r)}get(i){return this.cache.get(i)}has(i){return this.cache.has(i)}delete(i){this.cache.delete(i)}clear(){this.cache.clear()}}const S=new b,x=E`
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
`;var d=function(t,i,r,o){var n=arguments.length,e=n<3?i:o,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(t,i,r,o);else for(var l=t.length-1;l>=0;l--)(c=t[l])&&(e=(n<3?c(e):n>3?c(i,r,e):c(i,r))||e);return n>3&&e&&Object.defineProperty(i,r,e),e};const L={add:async()=>(await a(async()=>{const{addSvg:t}=await import("./add-DQRtCOZZ.js");return{addSvg:t}},__vite__mapDeps([0,1]))).addSvg,allWallets:async()=>(await a(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-CCq2jbv2.js");return{allWalletsSvg:t}},__vite__mapDeps([2,1]))).allWalletsSvg,arrowBottomCircle:async()=>(await a(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-DR3peI7W.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([3,1]))).arrowBottomCircleSvg,appStore:async()=>(await a(async()=>{const{appStoreSvg:t}=await import("./app-store-CioN5oda.js");return{appStoreSvg:t}},__vite__mapDeps([4,1]))).appStoreSvg,apple:async()=>(await a(async()=>{const{appleSvg:t}=await import("./apple-moubl183.js");return{appleSvg:t}},__vite__mapDeps([5,1]))).appleSvg,arrowBottom:async()=>(await a(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-D2wZUJfK.js");return{arrowBottomSvg:t}},__vite__mapDeps([6,1]))).arrowBottomSvg,arrowLeft:async()=>(await a(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-C7ChVx6M.js");return{arrowLeftSvg:t}},__vite__mapDeps([7,1]))).arrowLeftSvg,arrowRight:async()=>(await a(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-C0tnBMb8.js");return{arrowRightSvg:t}},__vite__mapDeps([8,1]))).arrowRightSvg,arrowTop:async()=>(await a(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-BzPpz9C3.js");return{arrowTopSvg:t}},__vite__mapDeps([9,1]))).arrowTopSvg,bank:async()=>(await a(async()=>{const{bankSvg:t}=await import("./bank-DafQd8kc.js");return{bankSvg:t}},__vite__mapDeps([10,1]))).bankSvg,browser:async()=>(await a(async()=>{const{browserSvg:t}=await import("./browser-CaN7fVIq.js");return{browserSvg:t}},__vite__mapDeps([11,1]))).browserSvg,bin:async()=>(await a(async()=>{const{binSvg:t}=await import("./bin-BVGNIRAo.js");return{binSvg:t}},__vite__mapDeps([12,1]))).binSvg,bitcoin:async()=>(await a(async()=>{const{bitcoinSvg:t}=await import("./bitcoin-uAkOmrnZ.js");return{bitcoinSvg:t}},__vite__mapDeps([13,1]))).bitcoinSvg,card:async()=>(await a(async()=>{const{cardSvg:t}=await import("./card-BGGtOKrJ.js");return{cardSvg:t}},__vite__mapDeps([14,1]))).cardSvg,checkmark:async()=>(await a(async()=>{const{checkmarkSvg:t}=await import("./checkmark-CNW3jbqF.js");return{checkmarkSvg:t}},__vite__mapDeps([15,1]))).checkmarkSvg,checkmarkBold:async()=>(await a(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-C9_kWVys.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([16,1]))).checkmarkBoldSvg,chevronBottom:async()=>(await a(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-CnNCGtmR.js");return{chevronBottomSvg:t}},__vite__mapDeps([17,1]))).chevronBottomSvg,chevronLeft:async()=>(await a(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-CcL1sMyJ.js");return{chevronLeftSvg:t}},__vite__mapDeps([18,1]))).chevronLeftSvg,chevronRight:async()=>(await a(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-N_t5Riga.js");return{chevronRightSvg:t}},__vite__mapDeps([19,1]))).chevronRightSvg,chevronTop:async()=>(await a(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-BcXnm8KL.js");return{chevronTopSvg:t}},__vite__mapDeps([20,1]))).chevronTopSvg,chromeStore:async()=>(await a(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-igC6NKGV.js");return{chromeStoreSvg:t}},__vite__mapDeps([21,1]))).chromeStoreSvg,clock:async()=>(await a(async()=>{const{clockSvg:t}=await import("./clock-GBY-45XZ.js");return{clockSvg:t}},__vite__mapDeps([22,1]))).clockSvg,close:async()=>(await a(async()=>{const{closeSvg:t}=await import("./close-Clu0PiQZ.js");return{closeSvg:t}},__vite__mapDeps([23,1]))).closeSvg,compass:async()=>(await a(async()=>{const{compassSvg:t}=await import("./compass-zaTftaRT.js");return{compassSvg:t}},__vite__mapDeps([24,1]))).compassSvg,coinPlaceholder:async()=>(await a(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-B1LDi0hS.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([25,1]))).coinPlaceholderSvg,copy:async()=>(await a(async()=>{const{copySvg:t}=await import("./copy-TrUqi6oc.js");return{copySvg:t}},__vite__mapDeps([26,1]))).copySvg,cursor:async()=>(await a(async()=>{const{cursorSvg:t}=await import("./cursor-CQGj65SP.js");return{cursorSvg:t}},__vite__mapDeps([27,1]))).cursorSvg,cursorTransparent:async()=>(await a(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-CEpDH82W.js");return{cursorTransparentSvg:t}},__vite__mapDeps([28,1]))).cursorTransparentSvg,circle:async()=>(await a(async()=>{const{circleSvg:t}=await import("./circle-Cj8Wknt6.js");return{circleSvg:t}},__vite__mapDeps([29,1]))).circleSvg,desktop:async()=>(await a(async()=>{const{desktopSvg:t}=await import("./desktop-DRaqcaC0.js");return{desktopSvg:t}},__vite__mapDeps([30,1]))).desktopSvg,disconnect:async()=>(await a(async()=>{const{disconnectSvg:t}=await import("./disconnect-SOo6ySVK.js");return{disconnectSvg:t}},__vite__mapDeps([31,1]))).disconnectSvg,discord:async()=>(await a(async()=>{const{discordSvg:t}=await import("./discord-CKGtex_z.js");return{discordSvg:t}},__vite__mapDeps([32,1]))).discordSvg,ethereum:async()=>(await a(async()=>{const{ethereumSvg:t}=await import("./ethereum-BpWQM075.js");return{ethereumSvg:t}},__vite__mapDeps([33,1]))).ethereumSvg,etherscan:async()=>(await a(async()=>{const{etherscanSvg:t}=await import("./etherscan-CIt0U143.js");return{etherscanSvg:t}},__vite__mapDeps([34,1]))).etherscanSvg,extension:async()=>(await a(async()=>{const{extensionSvg:t}=await import("./extension-B6Wcmj-K.js");return{extensionSvg:t}},__vite__mapDeps([35,1]))).extensionSvg,externalLink:async()=>(await a(async()=>{const{externalLinkSvg:t}=await import("./external-link-WaS1F0X0.js");return{externalLinkSvg:t}},__vite__mapDeps([36,1]))).externalLinkSvg,facebook:async()=>(await a(async()=>{const{facebookSvg:t}=await import("./facebook-D-bOtqNJ.js");return{facebookSvg:t}},__vite__mapDeps([37,1]))).facebookSvg,farcaster:async()=>(await a(async()=>{const{farcasterSvg:t}=await import("./farcaster-tXsqPPNi.js");return{farcasterSvg:t}},__vite__mapDeps([38,1]))).farcasterSvg,filters:async()=>(await a(async()=>{const{filtersSvg:t}=await import("./filters-CdM_eISy.js");return{filtersSvg:t}},__vite__mapDeps([39,1]))).filtersSvg,github:async()=>(await a(async()=>{const{githubSvg:t}=await import("./github-uZJf1t3J.js");return{githubSvg:t}},__vite__mapDeps([40,1]))).githubSvg,google:async()=>(await a(async()=>{const{googleSvg:t}=await import("./google-CAf_eygs.js");return{googleSvg:t}},__vite__mapDeps([41,1]))).googleSvg,helpCircle:async()=>(await a(async()=>{const{helpCircleSvg:t}=await import("./help-circle-B2fApfZ6.js");return{helpCircleSvg:t}},__vite__mapDeps([42,1]))).helpCircleSvg,image:async()=>(await a(async()=>{const{imageSvg:t}=await import("./image-k8C1dfZ9.js");return{imageSvg:t}},__vite__mapDeps([43,1]))).imageSvg,id:async()=>(await a(async()=>{const{idSvg:t}=await import("./id-Bql5EUvv.js");return{idSvg:t}},__vite__mapDeps([44,1]))).idSvg,infoCircle:async()=>(await a(async()=>{const{infoCircleSvg:t}=await import("./info-circle-GL2u8tdm.js");return{infoCircleSvg:t}},__vite__mapDeps([45,1]))).infoCircleSvg,lightbulb:async()=>(await a(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-wDFWfHob.js");return{lightbulbSvg:t}},__vite__mapDeps([46,1]))).lightbulbSvg,mail:async()=>(await a(async()=>{const{mailSvg:t}=await import("./mail-CDE-kzlb.js");return{mailSvg:t}},__vite__mapDeps([47,1]))).mailSvg,mobile:async()=>(await a(async()=>{const{mobileSvg:t}=await import("./mobile-CccdpqIr.js");return{mobileSvg:t}},__vite__mapDeps([48,1]))).mobileSvg,more:async()=>(await a(async()=>{const{moreSvg:t}=await import("./more-CZh9FHJr.js");return{moreSvg:t}},__vite__mapDeps([49,1]))).moreSvg,networkPlaceholder:async()=>(await a(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-CoI0AdBc.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([50,1]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await a(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-DuA9XC84.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([51,1]))).nftPlaceholderSvg,off:async()=>(await a(async()=>{const{offSvg:t}=await import("./off-DS_5cqGY.js");return{offSvg:t}},__vite__mapDeps([52,1]))).offSvg,playStore:async()=>(await a(async()=>{const{playStoreSvg:t}=await import("./play-store-j2NWp90J.js");return{playStoreSvg:t}},__vite__mapDeps([53,1]))).playStoreSvg,plus:async()=>(await a(async()=>{const{plusSvg:t}=await import("./plus-Xv-JYzDu.js");return{plusSvg:t}},__vite__mapDeps([54,1]))).plusSvg,qrCode:async()=>(await a(async()=>{const{qrCodeIcon:t}=await import("./qr-code-B7lGiCRa.js");return{qrCodeIcon:t}},__vite__mapDeps([55,1]))).qrCodeIcon,recycleHorizontal:async()=>(await a(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-BbNbOPUG.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([56,1]))).recycleHorizontalSvg,refresh:async()=>(await a(async()=>{const{refreshSvg:t}=await import("./refresh-CJOVDg--.js");return{refreshSvg:t}},__vite__mapDeps([57,1]))).refreshSvg,search:async()=>(await a(async()=>{const{searchSvg:t}=await import("./search-BqIc4Z9D.js");return{searchSvg:t}},__vite__mapDeps([58,1]))).searchSvg,send:async()=>(await a(async()=>{const{sendSvg:t}=await import("./send-mNT5B-aI.js");return{sendSvg:t}},__vite__mapDeps([59,1]))).sendSvg,swapHorizontal:async()=>(await a(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-D8B8HIk2.js");return{swapHorizontalSvg:t}},__vite__mapDeps([60,1]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await a(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-U0H6R4Vv.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([61,1]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await a(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-CVkvbxx_.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([62,1]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await a(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-Clw1XwLw.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([63,1]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await a(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-dujHueTF.js");return{swapVerticalSvg:t}},__vite__mapDeps([64,1]))).swapVerticalSvg,solana:async()=>(await a(async()=>{const{solanaSvg:t}=await import("./solana-KISekc8K.js");return{solanaSvg:t}},__vite__mapDeps([65,1]))).solanaSvg,telegram:async()=>(await a(async()=>{const{telegramSvg:t}=await import("./telegram-Ci5N-ikQ.js");return{telegramSvg:t}},__vite__mapDeps([66,1]))).telegramSvg,threeDots:async()=>(await a(async()=>{const{threeDotsSvg:t}=await import("./three-dots-zr8GiXao.js");return{threeDotsSvg:t}},__vite__mapDeps([67,1]))).threeDotsSvg,twitch:async()=>(await a(async()=>{const{twitchSvg:t}=await import("./twitch-BMHmf4S7.js");return{twitchSvg:t}},__vite__mapDeps([68,1]))).twitchSvg,twitter:async()=>(await a(async()=>{const{xSvg:t}=await import("./x-BXu1IXWM.js");return{xSvg:t}},__vite__mapDeps([69,1]))).xSvg,twitterIcon:async()=>(await a(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-BELNG64c.js");return{twitterIconSvg:t}},__vite__mapDeps([70,1]))).twitterIconSvg,verify:async()=>(await a(async()=>{const{verifySvg:t}=await import("./verify-MN3aNET3.js");return{verifySvg:t}},__vite__mapDeps([71,1]))).verifySvg,verifyFilled:async()=>(await a(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-CsfYERry.js");return{verifyFilledSvg:t}},__vite__mapDeps([72,1]))).verifyFilledSvg,wallet:async()=>(await a(async()=>{const{walletSvg:t}=await import("./wallet-D3y9SECi.js");return{walletSvg:t}},__vite__mapDeps([73,1]))).walletSvg,walletConnect:async()=>(await a(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-DxWLcJsn.js");return{walletConnectSvg:t}},__vite__mapDeps([74,1]))).walletConnectSvg,walletConnectLightBrown:async()=>(await a(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-DxWLcJsn.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([74,1]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await a(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-DxWLcJsn.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([74,1]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await a(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-Bi82AGqW.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([75,1]))).walletPlaceholderSvg,warningCircle:async()=>(await a(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-B94wc9I_.js");return{warningCircleSvg:t}},__vite__mapDeps([76,1]))).warningCircleSvg,x:async()=>(await a(async()=>{const{xSvg:t}=await import("./x-BXu1IXWM.js");return{xSvg:t}},__vite__mapDeps([69,1]))).xSvg,info:async()=>(await a(async()=>{const{infoSvg:t}=await import("./info-BAKMuBzo.js");return{infoSvg:t}},__vite__mapDeps([77,1]))).infoSvg,exclamationTriangle:async()=>(await a(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-DjmPTT1d.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([78,1]))).exclamationTriangleSvg,reown:async()=>(await a(async()=>{const{reownSvg:t}=await import("./reown-logo-DTQc2HJ5.js");return{reownSvg:t}},__vite__mapDeps([79,1]))).reownSvg,"x-mark":async()=>(await a(async()=>{const{xMarkSvg:t}=await import("./x-mark-DQ5cmAwU.js");return{xMarkSvg:t}},__vite__mapDeps([80,1]))).xMarkSvg};async function $(t){if(S.has(t))return S.get(t);const r=(L[t]??L.copy)();return S.set(t,r),r}let g=class extends R{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `,y`${I($(this.name),y`<div class="fallback"></div>`)}`}};g.styles=[T,O,x];d([s()],g.prototype,"size",void 0);d([s()],g.prototype,"name",void 0);d([s()],g.prototype,"color",void 0);d([s()],g.prototype,"aspectRatio",void 0);g=d([P("wui-icon")],g);const C=E`
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
  .wui-font-micro-600,
  .wui-font-micro-500 {
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
`;var m=function(t,i,r,o){var n=arguments.length,e=n<3?i:o===null?o=Object.getOwnPropertyDescriptor(i,r):o,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(t,i,r,o);else for(var l=t.length-1;l>=0;l--)(c=t[l])&&(e=(n<3?c(e):n>3?c(i,r,e):c(i,r))||e);return n>3&&e&&Object.defineProperty(i,r,e),e};let v=class extends R{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const i={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `,y`<slot class=${D(i)}></slot>`}};v.styles=[T,C];m([s()],v.prototype,"variant",void 0);m([s()],v.prototype,"color",void 0);m([s()],v.prototype,"align",void 0);m([s()],v.prototype,"lineClamp",void 0);v=m([P("wui-text")],v);const z=E`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var u=function(t,i,r,o){var n=arguments.length,e=n<3?i:o===null?o=Object.getOwnPropertyDescriptor(i,r):o,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(t,i,r,o);else for(var l=t.length-1;l>=0;l--)(c=t[l])&&(e=(n<3?c(e):n>3?c(i,r,e):c(i,r))||e);return n>3&&e&&Object.defineProperty(i,r,e),e};let _=class extends R{render(){return this.style.cssText=`
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
    `,y`<slot></slot>`}};_.styles=[T,z];u([s()],_.prototype,"flexDirection",void 0);u([s()],_.prototype,"flexWrap",void 0);u([s()],_.prototype,"flexBasis",void 0);u([s()],_.prototype,"flexGrow",void 0);u([s()],_.prototype,"flexShrink",void 0);u([s()],_.prototype,"alignItems",void 0);u([s()],_.prototype,"justifyContent",void 0);u([s()],_.prototype,"columnGap",void 0);u([s()],_.prototype,"rowGap",void 0);u([s()],_.prototype,"gap",void 0);u([s()],_.prototype,"padding",void 0);u([s()],_.prototype,"margin",void 0);_=u([P("wui-flex")],_);export{w as U,P as c};
