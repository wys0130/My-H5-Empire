(window.webpackJsonp=window.webpackJsonp||[]).push([[106],{wYZQ:function(s,_,e){s.exports={wrap:"wrap___115df",header:"header___16FzI",logoArea:"logoArea___XBuLC",backBtn:"backBtn___1Igl-",logo:"logo___15WuW",logoText:"logoText___2NazV",operationBar:"operationBar___19VmI",contentWrap:"contentWrap___xZYnv",codeWrap:"codeWrap___1XZf2",previewWrap:"previewWrap___31cfv"}},xh0k:function(s,_,e){"use strict";e.r(_);var Y=e("+L6B"),i=e("2/Rp"),V=e("miYZ"),W=e("tsqr"),E=e("tJVT"),n=e("q1tI"),t=e.n(n),m=e("a2PE"),J=e.n(m),h=e("Iab2"),Q=e.n(h),y=e("zwU1"),A=e.n(y),T=e("wYZQ"),o=e.n(T),v=e("RKZ9"),U=e("ga3A"),I=e("mP80");e("1eCo"),e("+dQi");var g=(v.d,"http://localhost:3000"),D=`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
      html,body {
        margin: 0;
        padding: 0;
      }
      #root {
        padding-top: 200px;
        text-align: center;
      }
      p {
        padding: 0 10px;
        color: #06c;
        line-height: 1.8;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <img src="http://io.nainor.com/uploads/logo_1747374040f.png" />
      <p>
        (H5\u7F16\u8F91\u5668)H5-Dooring\u662F\u4E00\u6B3E\u529F\u80FD\u5F3A\u5927\uFF0C\u5F00\u6E90\u514D\u8D39\u7684H5\u53EF\u89C6\u5316\u9875\u9762\u914D\u7F6E\u89E3\u51B3\u65B9\u6848\uFF0C
        \u81F4\u529B\u4E8E\u63D0\u4F9B\u4E00\u5957\u7B80\u5355\u65B9\u4FBF\u3001\u4E13\u4E1A\u53EF\u9760\u3001\u65E0\u9650\u53EF\u80FD\u7684H5\u843D\u5730\u9875\u6700\u4F73\u5B9E\u8DF5\u3002
      </p>
    </div>
  </body>
</html>
`;_.default=function(){var R=Object(n.useState)(!1),p=Object(E.a)(R,2),x=p[0],K=p[1],L=Object(n.useState)({line:1,ch:1}),O=Object(E.a)(L,2),M=O[0],j=O[1],b=Object(n.useState)({data:D}),P=Object(E.a)(b,2),u=P[0],N=P[1],S=(a,r,l)=>{N({data:l})},c=Object(n.useMemo)(()=>a=>{var r=a!=null?a:u.data;fetch("".concat(g,"/dooring/render"),{method:"POST",body:r}).then(()=>{D=r,W.default.success("\u5DF2\u4FDD\u5B58"),K(l=>!l)})},[u]),B=()=>{var a=new File([u.data],"".concat(Date.now(),".html"),{type:"text/html;charset=utf-8"});Object(h.saveAs)(a)},H=(a,r)=>{var l=r.line,z=r.ch;j({line:l,ch:z})};Object(I.a)("ctrl+s",a=>{c(),a.preventDefault()},[u]);var F=Object(n.useMemo)(()=>(a,r)=>{r.ctrlKey&&r.key==="s"&&(c(a.getValue()),r.preventDefault())},[c]),Z=Object(n.useMemo)(()=>t.a.createElement(m.Controlled,{className:o.a.codeWrap,value:u.data,options:{mode:"xml",theme:"material",lineNumbers:!0},onBeforeChange:S,cursor:M,onCursor:H,onKeyDown:F}),[M,u.data,F]),C=Object(v.h)(),f=Object(n.useMemo)(()=>{var a=C.height-42-1;return a<694?694:a},[C.height]),d=Object(n.useMemo)(()=>694,[]),w=Object(n.useMemo)(()=>d-30-12-12,[d]);return t.a.createElement("div",{className:o.a.wrap},t.a.createElement("div",{className:o.a.header},t.a.createElement("div",{className:o.a.logoArea},t.a.createElement("div",{className:o.a.logo,title:"Dooring"},t.a.createElement("a",{href:"http://h5.dooring.cn"},t.a.createElement("img",{src:A.a,alt:"Dooring-\u5F3A\u5927\u7684h5\u7F16\u8F91\u5668"}))),t.a.createElement("div",{className:o.a.logoText},"| \u5728\u7EBF\u4EE3\u7801\u7F16\u8F91\u5668")),t.a.createElement("div",{className:o.a.operationBar},t.a.createElement(i.a,{type:"primary",title:"\u4FDD\u5B58\uFF08ctrl+s\uFF09",onClick:()=>c(),style:{marginRight:"10px"}},t.a.createElement(U.a,null)),t.a.createElement(i.a,{type:"primary",onClick:B,style:{marginRight:"10px"}},"\u4E0B\u8F7D\u9875\u9762"),t.a.createElement(i.a,{danger:!0,onClick:B},"\u4E00\u952E\u90E8\u7F72"))),t.a.createElement("div",{className:o.a.contentWrap,style:{height:"".concat(f,"px"),position:"relative"}},t.a.createElement("div",{className:o.a.codeWrap,style:{height:"".concat(f,"px"),position:"relative"}},Z),t.a.createElement("div",{className:o.a.previewWrap,style:{height:"".concat(d,"px")}},t.a.createElement("iframe",{title:"preview",src:"".concat(g,"/html?flag=").concat(x),style:{width:"100%",height:"".concat(w,"px"),margin:0,padding:0,border:"none"}}))))}},zwU1:function(s,_,e){s.exports=e.p+"static/logo.e05d570e.png"}}]);

//# sourceMappingURL=p__ide.js.map