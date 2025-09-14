import{u,R as c,j as e,L as h}from"./index-whtjvH89.js";import{b as y}from"./banner-Bhj8EXtK.js";import{s as b}from"./Silk-BGXKZuSK.js";function _(){const r=u(),[s,l]=c.useState({x:0,y:0});return c.useEffect(()=>{const t=o=>{o.key==="1"&&r("/manual/app"),o.key==="2"&&r("/manual/web")};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[r]),e.jsxs("div",{className:"min-h-screen relative overflow-hidden",onMouseMove:t=>l({x:t.clientX,y:t.clientY}),style:{"--mx":`${s.x}px`,"--my":`${s.y}px`,filter:"saturate(1.08) contrast(1.08) brightness(1.03)"},children:[e.jsx("img",{src:y,className:"absolute inset-0 w-full h-full object-cover opacity-10",alt:""}),e.jsx("div",{className:"pointer-events-none absolute inset-0 bg-[radial-gradient(600px_600px_at_var(--mx)_var(--my),rgba(255,255,255,0.12),transparent_40%)]"}),e.jsx("div",{className:"pointer-events-none absolute inset-0 opacity-5",style:{backgroundImage:"radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",backgroundSize:"3px 3px"}}),e.jsx("img",{src:b,className:"absolute -right-24 -bottom-40 w-[50rem] opacity-50 pointer-events-none animate-slow-float",alt:""}),e.jsxs("div",{className:"relative z-10 max-w-5xl mx-auto px-6 py-16",children:[e.jsx("h1",{className:`text-left ml-0 mr-auto font-extrabold tracking-tight leading-none\r
                     bg-clip-text text-transparent drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]\r
                     animate-text-gradient text-[clamp(3rem,8vw,7rem)]`,style:{backgroundImage:"linear-gradient(92deg,#22d3ee 0%,#34d399 25%,#facc15 52%,#f59e0b 78%,#a78bfa 100%)",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",filter:"saturate(1.25) contrast(1.15)",backgroundSize:"200% 100%",backgroundPosition:"0% 50%"},children:"Manual Builder"}),e.jsxs("p",{className:"mt-4 text-white/90 max-w-2xl",children:["Chọn loại tài liệu cần soạn: Ứng dụng di động (APP) hoặc Giao dịch WEB. ",e.jsx("br",{}),e.jsx("span",{className:"text-white/70",children:"Phím tắt: 1 = APP, 2 = WEB"})]}),e.jsxs("div",{className:"mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6",children:[e.jsx(x,{to:"/manual/app",title:"HDSD APP",children:"Công cụ hiện có: mockup + annotate + export trang."}),e.jsx(x,{to:"/manual/web",title:"HDSD WEB",children:"Layout 60/40, khoanh vùng tự đánh số, step có ảnh vuông + mô tả."})]})]}),e.jsx("style",{children:`
        @keyframes text-gradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-text-gradient { animation: text-gradient 12s ease-in-out infinite alternate; }

        @keyframes slow-float {
          0%   { transform: translate3d(0,0,0) rotate(0deg) }
          50%  { transform: translate3d(0,-12px,0) rotate(2deg) }
          100% { transform: translate3d(0,0,0) rotate(0deg) }
        }
        .animate-slow-float { animation: slow-float 16s ease-in-out infinite; }

        /* Sheen quét khi hover */
          @keyframes sheen {
            0%   { transform: translateX(-35%) skewX(-12deg); opacity: 0; }
            12%  { opacity: .85; }
            88%  { opacity: .85; }
            100% { transform: translateX(160%) skewX(-12deg); opacity: 0; }
          }
          .group:hover .sheen__bar {
            animation: sheen 900ms ease;
          }

        /* Spotlight bám chuột + glow màu cho card */
        .card-spotlight {
          background:
            radial-gradient(220px 160px at var(--x) var(--y),
              rgba(56,189,248,.30),
              rgba(168,85,247,.24) 35%,
              transparent 65%);
          mix-blend-mode: screen;
          filter: saturate(120%) brightness(115%);
          transition: opacity .15s ease;
        }
      `})]})}function x({to:r,title:s,children:l}){const t=c.useRef(null),o=a=>{const n=t.current,i=n.getBoundingClientRect(),d=a.clientX-i.left,p=a.clientY-i.top;n.style.setProperty("--x",`${d}px`),n.style.setProperty("--y",`${p}px`),n.style.setProperty("--rx",`${(p/i.height-.5)*6}deg`),n.style.setProperty("--ry",`${(d/i.width-.5)*-6}deg`)},m=()=>{var a;return(a=t.current)==null?void 0:a.style.setProperty("--o","1")},g=()=>{const a=t.current;a.style.setProperty("--o","0"),a.style.setProperty("--rx","0deg"),a.style.setProperty("--ry","0deg")};return e.jsxs(h,{ref:t,to:r,onMouseMove:o,onMouseEnter:m,onMouseLeave:g,className:`\r
        group relative overflow-hidden rounded-2xl\r
        border border-white/15 bg-white/[0.10] backdrop-blur-md\r
        transition-all duration-300 ease-out will-change-transform\r
        shadow-[0_10px_30px_-10px_rgba(0,0,0,.45)]\r
        hover:shadow-[0_0_0_1px_rgba(255,255,255,.22),0_20px_50px_-12px_rgba(56,189,248,.45),0_28px_70px_-20px_rgba(168,85,247,.5)]\r
        [transform:perspective(900px)_rotateX(var(--rx,0))_rotateY(var(--ry,0))]\r
      `,children:[e.jsx("span",{className:"pointer-events-none absolute inset-0 rounded-2xl card-spotlight",style:{opacity:"var(--o,0)"}}),e.jsx("span",{className:"pointer-events-none absolute inset-0 rounded-2xl overflow-hidden",children:e.jsx("span",{className:`sheen__bar absolute inset-y-[-30%] left-[-25%] w-[80%]\r
                      bg-gradient-to-r from-white/0 via-white/65 to-white/0\r
                      opacity-0 will-change-transform`})}),e.jsxs("div",{className:"relative p-6",children:[e.jsx("div",{className:`text-xl font-semibold tracking-wide\r
                    transition-colors duration-200\r
                    group-hover:text-orange-400`,children:s}),e.jsx("div",{className:`text-sm opacity-90 mt-1\r
                    transition-colors duration-200\r
                    group-hover:text-orange-400`,children:l})]})]})}export{_ as default};
