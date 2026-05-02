import React from "react";

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function sampleSpline(points, t) {
  const n = points.length;
  const scaled = t * n;
  const i = Math.floor(scaled) % n;
  const localT = scaled - Math.floor(scaled);
  const p0 = points[(i - 1 + n) % n];
  const p1 = points[i % n];
  const p2 = points[(i + 1) % n];
  const p3 = points[(i + 2) % n];
  return catmullRom(p0, p1, p2, p3, localT);
}

function OrbitalGhostTrail(props) {
  const { centerX, centerY, scale = 1 } = props;
  const [time, setTime] = React.useState(0);

  React.useEffect(() => {
    let frame;
    let start;
    const loop = (ts) => {
      if (!start) start = ts;
      setTime((ts - start) / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const path = [
    { x: -72, y: 24 },
    { x: -28, y: -18 },
    { x: 18, y: -42 },
    { x: 54, y: -22 },
    { x: 56, y: 20 },
    { x: 22, y: 50 },
    { x: -26, y: 42 },
    { x: -62, y: 6 },
    { x: -36, y: -32 },
    { x: 12, y: -50 },
  ];

  const duration = 5.6;
  const wobbleX = Math.sin(time * 0.9) * 4.5 * scale;
  const wobbleY = Math.cos(time * 1.2) * 3.2 * scale;
  const pulse = 1 + Math.sin(time * 1.7) * 0.06;
  const phase = ((time + Math.sin(time * 0.55) * 0.18) % duration) / duration;

  const ghosts = Array.from({ length: 8 }).map((_, i) => {
    const offset = i * 0.04;
    const t = (phase - offset + 1) % 1;
    const p = sampleSpline(path, t);
    const pNext = sampleSpline(path, (t + 0.01) % 1);

    const tx = pNext.x - p.x;
    const ty = pNext.y - p.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;

    const progressFade = 1 - i / 8;
    const drift =
      Math.sin(time * 1.3 + i * 0.6) * (6 + progressFade * 8) * scale * 0.25;

    return {
      x:
        centerX +
        p.x * scale +
        wobbleX * (0.35 + progressFade * 0.4) +
        nx * drift,
      y:
        centerY +
        p.y * scale +
        wobbleY * (0.35 + progressFade * 0.4) +
        ny * drift,
      size: (10 + progressFade * 14) * scale * (pulse - i * 0.01),
      alpha: Math.max(
        0.05,
        0.1 + progressFade * 0.72 + Math.sin(time * 2.1 - i * 0.55) * 0.03,
      ),
      blur: 5.2 - progressFade * 3.4 + Math.sin(time * 1.5 + i * 0.7) * 0.35,
    };
  });

  const ringDots = Array.from({ length: 7 }).map((_, i) => {
    const t = (phase + i / 7) % 1;
    const p = sampleSpline(path, t);
    const pNext = sampleSpline(path, (t + 0.01) % 1);

    const tx = pNext.x - p.x;
    const ty = pNext.y - p.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;

    const drift = Math.cos(time * 1.1 + i * 0.8) * 4 * scale * 0.25;

    return {
      x: centerX + p.x * scale + wobbleX * 0.22 + nx * drift,
      y: centerY + p.y * scale + wobbleY * 0.22 + ny * drift,
    };
  });

  const head = ghosts[0];

  return (
    <>
      {ghosts
        .slice()
        .reverse()
        .map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: dot.x - dot.size / 2,
              top: dot.y - dot.size / 2,
              width: dot.size,
              height: dot.size,
              opacity: dot.alpha,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(210,242,255,0.9) 24%, rgba(120,208,255,0.56) 46%, rgba(60,120,255,0.12) 72%, transparent 100%)",
              boxShadow:
                "0 0 10px rgba(225,248,255,0.8), 0 0 24px rgba(78,192,255,0.45), 0 0 42px rgba(78,145,255,0.14)",
              filter: `blur(${dot.blur}px)`,
            }}
          />
        ))}

      {ringDots.map((dot, i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            left: dot.x - 4 * scale,
            top: dot.y - 4 * scale,
            width: 8 * scale,
            height: 8 * scale,
            opacity: Math.max(
              0.04,
              0.1 + Math.sin(time * 1.8 + i * 0.9) * 0.025,
            ),
            background: "rgba(202,238,255,0.8)",
            boxShadow: "0 0 9px rgba(120,210,255,0.28)",
            filter: `blur(${3.1 + Math.sin(time * 1.25 + i) * 0.35}px)`,
          }}
        />
      ))}

      <div
        className="absolute rounded-full"
        style={{
          left: head.x - 42 * scale,
          top: head.y - 10 * scale,
          width: 94 * scale,
          height: 20 * scale,
          background:
            "linear-gradient(to right, rgba(60,130,255,0), rgba(88,188,255,0.18), rgba(60,130,255,0))",
          filter: "blur(10px)",
          opacity: 0.26,
          transform: `rotate(${Math.sin(time * 1.15) * 10 + Math.cos(time * 0.6) * 4 + Math.sin(time * 2.3 + 1.2) * 3}deg) scale(${1 + Math.sin(time * 1.6) * 0.05 + Math.cos(time * 0.8) * 0.02}) skewX(${Math.sin(time * 0.9) * 2}deg)`,
        }}
      />
    </>
  );
}

function FuzzyText(props) {
  const { children, selected = false, className = "", style = {} } = props;
  const mainColor = selected ? "#7fe8ff" : "#8f829b";
  const ghostColor = selected ? "#8fe6ff" : "#9a8ea8";
  const shadow = selected
    ? "0 0 0.5px rgba(0,0,0,0.92), 0 0 1px rgba(0,0,0,0.75), 0 0 3px rgba(120,240,255,0.95), 0 0 18px rgba(70,210,255,0.9), 0 0 34px rgba(40,190,255,0.65)"
    : "0 0 0.5px rgba(0,0,0,0.88), 0 0 1px rgba(0,0,0,0.68), 0 0 2px rgba(130,120,145,0.5), 0 0 10px rgba(90,80,105,0.26)";

  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden
        className="absolute left-[1.6px] top-[1.2px] opacity-35 select-none pointer-events-none whitespace-nowrap"
        style={{
          color: ghostColor,
          filter: "blur(2.4px)",
          fontFamily:
            'Arial, Helvetica, "Nimbus Sans", "Liberation Sans", sans-serif',
        }}
      >
        {children}
      </div>
      <div
        className="relative whitespace-nowrap"
        style={{
          color: mainColor,
          textShadow: shadow,
          filter: selected ? "blur(1.1px)" : "blur(1.35px)",
          transform: selected ? "scaleY(1.02)" : "none",
          WebkitTextStroke: selected
            ? "0.8px rgba(0,0,0,0.95)"
            : "0.6px rgba(0,0,0,0.85)",
          fontFamily:
            'Arial, Helvetica, "Nimbus Sans", "Liberation Sans", sans-serif',
          ...style, // 👈 add this line
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function CRTCaptchaReplica() {
  const audioRef = React.useRef(null);

  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [cursorVisible, setCursorVisible] = React.useState(true);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // autoplay might be blocked until user interacts
        });
      }
    }
  }, []);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showError = touched && email.length > 0 && !emailIsValid;

  const subscribe = async () => {
    setTouched(true);
    setStatusMessage("");

    if (!emailIsValid) {
      setStatusMessage("please enter a valid email address");
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "subscription failed, try again");
      }

      setStatusMessage("subscribed for updates");
      setEmail("");
      setTouched(false);
    } catch (error) {
      setStatusMessage(error?.message || "something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearInput = () => {
    setEmail("");
    setTouched(false);
    setStatusMessage("input cleared");
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await subscribe();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearInput();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* AMBIENT AUDIO */}
      <audio ref={audioRef} src="/ocean.mp3" loop autoPlay />

      {/* BACKDROP IMAGE */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url("/backdrop3.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scale(1.10)",
          filter: "brightness(0.9) contrast(1.1)",
          opacity: 0.92,
        }}
      />

      {/* <video
        className="absolute inset-0 w-full h-full object-cover scale-[1.10]"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src="/backdrop.mp4"
        style={{
          filter: "brightness(0.9) contrast(1.1)",
          opacity: 0.92,
        }}
      /> */}

      {/* dark overlay to match PS2 mood */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,28,48,0.24),transparent_58%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_42%,rgba(0,0,0,0.45)_100%)]" />
      <div className="absolute left-[26%] top-[22%] h-[56%] w-px bg-white/5 opacity-20" />

      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 2px, transparent 5px)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 0.4px, transparent 0.65px)",
          backgroundSize: "4px 4px",
        }}
      />

      <div className="relative w-full max-w-[1100px] h-[520px] scale-[0.72] origin-center">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[260px]">
          <div className="absolute left-[-85px] top-[-6px] opacity-90">
            <div className="relative w-[292px] h-[292px] scale-[1.15]">
              <OrbitalGhostTrail centerX={146} centerY={146} scale={1.25} />
            </div>
          </div>

          <div className="absolute left-[155px] top-[88px] text-left">
            <div className="absolute -inset-x-6 -top-3 h-16 bg-[radial-gradient(circle_at_40%_50%,rgba(135,185,255,0.16),transparent_62%)] blur-2xl opacity-75" />

            <FuzzyText
              selected
              className="text-[64px] leading-[0.94] font-semibold tracking-[0.02em]"
            >
              sacca plateu
            </FuzzyText>

            <FuzzyText
              className="mt-2 text-[56px] leading-[0.94] font-medium tracking-[0.03em]"
              style={{
                color: "#ffffff",
                WebkitTextStroke: "1.2px rgba(0,0,0,0.95)",
                textShadow: `
      0 0 2px rgba(0,0,0,0.9),
      0 0 6px rgba(120,200,255,0.25)
    `,
              }}
            >
              sign up for updates
            </FuzzyText>

            <div className="mt-6 ml-[4px] relative w-[520px]">
              <div className="absolute inset-0 rounded-[6px] blur-[4px] opacity-55 bg-[linear-gradient(to_right,rgba(130,180,255,0.08),rgba(170,210,255,0.14),rgba(130,180,255,0.08))]" />

              <div className="relative h-[72px]">
                <div
                  className="absolute left-[28px] right-[28px] top-[12px] h-[3px]"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(120,150,210,0.75), rgba(160,190,245,0.92), rgba(120,150,210,0.75))",
                    boxShadow: "0 0 8px rgba(130,170,255,0.2)",
                    filter: "blur(0.2px)",
                  }}
                />
                <div
                  className="absolute left-[28px] right-[28px] bottom-[12px] h-[3px]"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(120,150,210,0.75), rgba(160,190,245,0.92), rgba(120,150,210,0.75))",
                    boxShadow: "0 0 8px rgba(130,170,255,0.2)",
                    filter: "blur(0.2px)",
                  }}
                />

                <div className="absolute left-[8px] top-[6px] w-[16px] h-[16px] border-l-[3px] border-t-[3px] border-[#8ea3d8]/90 blur-[0.15px]" />
                <div className="absolute right-[8px] top-[6px] w-[16px] h-[16px] border-r-[3px] border-t-[3px] border-[#8ea3d8]/90 blur-[0.15px]" />
                <div className="absolute left-[8px] bottom-[6px] w-[16px] h-[16px] border-l-[3px] border-b-[3px] border-[#8ea3d8]/90 blur-[0.15px]" />
                <div className="absolute right-[8px] bottom-[6px] w-[16px] h-[16px] border-r-[3px] border-b-[3px] border-[#8ea3d8]/90 blur-[0.15px]" />

                <div className="absolute inset-[18px_26px_18px_28px] flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (statusMessage) setStatusMessage("");
                    }}
                    onBlur={() => setTouched(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="enter email address"
                    className="w-full bg-transparent outline-none text-[35px] tracking-[0.02em] caret-transparent placeholder:text-grey"
                    style={{
                      color: "#b8d9ff",
                      textShadow:
                        "0 0 0.5px rgba(0,0,0,0.95), 0 0 6px rgba(120,170,255,0.14)",
                      filter: "blur(0.22px)",
                      fontFamily:
                        'Arial, Helvetica, "Nimbus Sans", "Liberation Sans", sans-serif',
                    }}
                  />

                  <div
                    aria-hidden
                    className="absolute left-[0px] top-1/2 -translate-y-1/2 w-[16px] h-[34px] rounded-[4px]"
                    style={{
                      opacity: cursorVisible ? 0.95 : 0.05,
                      background:
                        "linear-gradient(to bottom, rgba(180,205,255,0.95), rgba(135,160,230,0.9))",
                      boxShadow:
                        "0 0 8px rgba(165,190,255,0.22), inset 0 0 3px rgba(255,255,255,0.2)",
                      filter: "blur(0.2px)",
                    }}
                  />
                </div>
              </div>

              <div
                className="mt-2 ml-1 text-[16px] tracking-[0.03em] min-h-[24px]"
                style={{
                  color: showError
                    ? "#ff9ab0"
                    : statusMessage || (emailIsValid && touched)
                      ? "#9ff4ff"
                      : "#7f7589",
                  textShadow: showError
                    ? "0 0 6px rgba(255,120,150,0.22)"
                    : "0 0 8px rgba(90,220,255,0.22)",
                  filter: "blur(0.2px)",
                  fontFamily:
                    'Arial, Helvetica, "Nimbus Sans", "Liberation Sans", sans-serif',
                }}
              >
                {showError
                  ? "please enter a valid email address"
                  : statusMessage
                    ? statusMessage
                    : emailIsValid && touched
                      ? "email looks valid"
                      : " "}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgba(110,160,255,0.04) 20%, rgba(255,255,255,0.018) 50%, rgba(110,160,255,0.04) 80%, transparent 100%)",
        }}
      />

      {/* PLAYSTATION STYLE BUTTONS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-12 items-center">
        <button
          type="button"
          onClick={subscribe}
          disabled={isSubmitting}
          className="hover:scale-110 transition-transform duration-150 flex items-center gap-3 bg-transparent border-0 p-0 cursor-pointer disabled:opacity-60"
        >
          <img
            src="/x-button.png"
            alt="X button"
            className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(120,200,255,0.25)]"
            draggable="false"
          />
          <span
            className="text-[18px] tracking-wide"
            style={{
              fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif',
              fontWeight: 700,
              fontSize: "34px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#ffffff",

              WebkitTextStroke: "1.5px rgba(0,0,0,0.95)",

              textShadow: `
          0 0 2px rgba(0,0,0,0.9),
          0 0 6px rgba(255,255,255,0.2)
        `,

              transform: "scaleY(1.05)", // subtle PS2 stretch
            }}
          >
            {isSubmitting ? "Sending..." : "Ok"}
          </span>
        </button>

        <button
          type="button"
          onClick={clearInput}
          className="hover:scale-110 transition-transform duration-150 flex items-center gap-3 bg-transparent border-0 p-0 cursor-pointer"
        >
          <img
            src="/o-button.png"
            alt="O button"
            className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,140,140,0.25)]"
            draggable="false"
          />
          <span
            className="text-[18px] tracking-wide"
            style={{
              fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif',
              fontWeight: 700,
              fontSize: "34px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#ffffff",

              WebkitTextStroke: "1.5px rgba(0,0,0,0.95)",

              textShadow: `
          0 0 2px rgba(0,0,0,0.9),
          0 0 6px rgba(255,255,255,0.2)
        `,

              transform: "scaleY(1.05)",
            }}
          >
            CANCEL
          </span>
        </button>
      </div>
    </div>
  );
}
