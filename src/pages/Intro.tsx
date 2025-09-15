// src/pages/Intro.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import banner from "/assets/banner.png";
import silk from "/assets/Silk.png";

export default function Intro() {
  const nav = useNavigate();
  const [mouse, setMouse] = React.useState({ x: 0, y: 0 });

  // phím tắt nhanh
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") nav("/manual/app");
      if (e.key === "2") nav("/manual/web");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
      style={
        {
          ["--mx" as any]: `${mouse.x}px`,
          ["--my" as any]: `${mouse.y}px`,
          // boost nhẹ toàn trang (có thể tăng/giảm tùy mắt)
          filter: "saturate(1.08) contrast(1.08) brightness(1.03)",
        } as React.CSSProperties
      }
    >
      {/* BG chính */}
      <img
        src={banner}
        className="absolute inset-0 w-full h-full object-cover opacity-10"
        alt=""
      />

      {/* Spotlight bám chuột cho toàn trang */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_400px_at_var(--mx)_var(--my),rgba(255,255,255,0.12),transparent_30%)]" />

      {/* Noise/texture rất nhẹ để đỡ phẳng */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Silk bay chậm */}
      <img
        src={silk}
        className="absolute -right-24 -bottom-40 w-[50rem] opacity-50 pointer-events-none animate-slow-float"
        alt=""
      />
      <section className="relative min-h-dvh flex items-center">
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          {/* Title gradient aurora – nền ngoài chữ trong suốt */}
          <h1
            className="text-left ml-0 mr-auto font-extrabold tracking-tight leading-none
                      bg-clip-text text-transparent drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]
                      animate-text-gradient text-[clamp(3rem,8vw,7rem)]"
            style={{
              backgroundImage:
                "linear-gradient(92deg,#22d3ee 0%,#34d399 25%,#facc15 52%,#f59e0b 78%,#a78bfa 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "saturate(1.25) contrast(1.15)",
              backgroundSize: "200% 100%",
              backgroundPosition: "0% 50%",
            }}
          >
            Manual Builder
          </h1>

          <p className="mt-4 text-white/90 max-w-2xl">
            Chọn loại tài liệu cần soạn: Ứng dụng di động (APP) hoặc Giao dịch
            WEB. <br/><span className="text-white/70">Phím tắt: 1 = APP, 2 = WEB</span>
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">          
            <NavCard to="/manual/app" title="HDSD APP">            
                Công cụ hiện có: mockup + annotate + export trang.            
            </NavCard>
            <NavCard to="/manual/web" title="HDSD WEB">
              Layout 60/40, khoanh vùng tự đánh số, step có ảnh vuông + mô tả.
            </NavCard>
          </div>
        </div>
      </section>

      {/* CSS cục bộ cho animation & hiệu ứng */}
      <style>{`
        @keyframes text-gradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-text-gradient { animation: text-gradient 12s ease-in-out infinite alternate; }

        @keyframes slow-float {
          0%   { transform: translate3d(0,0,0) rotate(0deg) }
          50%  { transform: translate3d(0,-20px,0) rotate(2deg) }
          100% { transform: translate3d(0,0,0) rotate(0deg) }
        }
        .animate-slow-float { animation: slow-float 8s ease-in-out infinite; }

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
      `}</style>
    </div>
  );
}

function NavCard({
  to,
  title,
  children,
}: {
  to: string;
  title: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
    // tilt nhẹ cho có chiều sâu
    el.style.setProperty("--rx", `${((y / r.height) - 0.5) * 6}deg`);
    el.style.setProperty("--ry", `${((x / r.width) - 0.5) * -6}deg`);
  };
  const onEnter = () => ref.current?.style.setProperty("--o", "1");
  const onLeave = () => {
    const el = ref.current!;
    el.style.setProperty("--o", "0");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <Link
      ref={ref}
      to={to}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="
        group relative overflow-hidden rounded-2xl
        border border-white/15 bg-white/[0.10] backdrop-blur-md
        transition-all duration-300 ease-out will-change-transform
        shadow-[0_10px_30px_-10px_rgba(0,0,0,.45)]
        hover:shadow-[0_0_0_1px_rgba(255,255,255,.22),0_20px_50px_-12px_rgba(56,189,248,.45),0_28px_70px_-20px_rgba(168,85,247,.5)]
        [transform:perspective(900px)_rotateX(var(--rx,0))_rotateY(var(--ry,0))]
      "
    >
      {/* Spotlight bám chuột (glow mềm) */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl card-spotlight"
        style={{ opacity: "var(--o,0)" }}
      />

      {/* Vệt sheen quét chéo khi hover */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
        <span
          className="sheen__bar absolute inset-y-[-30%] left-[-25%] w-[80%]
                      bg-gradient-to-r from-white/0 via-white/65 to-white/0
                      opacity-0 will-change-transform"
        />
      </span>

      <div className="relative p-6">
        <div
          className="text-xl font-semibold tracking-wide
                    transition-colors duration-200
                    group-hover:text-orange-400"
        >
          {title}
        </div>
        <div
          className="text-sm opacity-90 mt-1
                    transition-colors duration-200
                    group-hover:text-orange-400"
        >
          {children}
        </div>
      </div>
    </Link>
  );
}
