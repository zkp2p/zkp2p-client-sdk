import{df as d,dg as n,dh as e,di as o,dj as a,dk as l}from"./index-CLls0W8x.js";const x=()=>{try{const r=d(),t=n()==="mobile",i=r.pathname==="/liquidity"&&!t;return e.jsx("div",{style:{display:i?"block":"none"},children:e.jsx(c,{children:e.jsxs(m,{children:[e.jsx(s,{src:"https://dune.com/embeds/4799764/7956679?darkMode=true",title:"Liquidity Analytics"}),e.jsx(s,{src:"https://dune.com/embeds/4765217/7907697?darkMode=true",title:"Volume Analytics"})]})})})}catch(r){return console.error("PersistentIframes error:",r),null}},c=o(a)`
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  margin-top: 20px;
`,m=o.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`,s=o.iframe`
  flex: 1;
  height: 300px;
  border: 1px solid ${l.defaultBorderColor};
  border-radius: 12px;
  scrolling: no;
  overflow: hidden;
`;export{x as default};
