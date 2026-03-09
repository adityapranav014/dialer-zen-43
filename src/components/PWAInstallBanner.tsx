import { useState, useEffect } from "react";
import { X, Download, Share, Plus, ArrowUpFromLine, SmartphoneNfc } from "lucide-react";

const STORAGE_KEY = "dialflow-pwa-prompt-dismissed";

type NativePrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

type Platform = "ios" | "native" | "unsupported";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS 13+ disguises itself as macOS (maxTouchPoints > 1 on iPad)
  const isIOS =
    (/iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) &&
    !(window as unknown as Record<string, unknown>).MSStream;
  if (isIOS) return "ios";
  // Only show on desktop/Android if the browser captured a native install prompt
  if ((window as unknown as Record<string, unknown>).__pwaInstallPrompt) return "native";
  return "unsupported";
}

function isAlreadyInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as Record<string, unknown>).standalone === true
  );
}

function getNativePrompt(): NativePrompt | null {
  return (
    ((window as unknown as Record<string, unknown>).__pwaInstallPrompt as NativePrompt) ?? null
  );
}

export function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unsupported");
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") return;
    if (isAlreadyInstalled()) return;

    // Re-check after a small delay in case the native prompt wasn't
    // stored yet when this component first mounted
    const timer = setTimeout(() => {
      const plat = detectPlatform();
      if (plat === "unsupported") return;
      setPlatform(plat);
      setVisible(true);
      requestAnimationFrame(() => setTimeout(() => setAnimateIn(true), 20));
    }, 3000);

    // Also listen in case the event fires after mount (rare but possible)
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      (window as unknown as Record<string, unknown>).__pwaInstallPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  const dismiss = (permanent = true) => {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 380);
    if (permanent) localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleInstall = async () => {
    if (platform === "native") {
      const prompt = getNativePrompt();
      if (!prompt) return;
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      (window as unknown as Record<string, unknown>).__pwaInstallPrompt = null;
      if (outcome === "accepted") dismiss(true);
    } else {
      // iOS — show step-by-step guide
      setShowSteps(true);
    }
  };

  if (!visible) return null;

  const isIOS = platform === "ios";
  const isNative = platform === "native";

  return (
    <div
      className={[
        "fixed left-0 right-0 z-[60] px-3 pb-3 md:pb-4 md:px-4",
        // Mobile: sits above bottom nav (h-14 = 3.5rem)
        "bottom-14 md:bottom-0",
        animateIn ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transition: "transform 380ms cubic-bezier(0.34,1.56,0.64,1), opacity 320ms ease" }}
    >
      <div className="max-w-lg mx-auto md:ml-auto md:mr-4 bg-card border border-border shadow-xl rounded-2xl overflow-hidden">
        {/* Top gradient accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <SmartphoneNfc className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">
                    Install DialFlow
                  </p>
                  <p className="text-xs text-foreground/55 mt-0.5 leading-snug">
                    {isIOS
                      ? "Add to your Home Screen for the full app experience"
                      : "Get the full app experience — works on any device, no app store needed"}
                  </p>
                </div>
                <button
                  onClick={() => dismiss(true)}
                  className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-foreground/30 hover:text-foreground hover:bg-accent transition-all duration-200 -mt-0.5"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Feature pills */}
              {!showSteps && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {["No app store", "Instant access", "Always up to date"].map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-foreground/60 border border-border"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* iOS step-by-step guide (shown after tapping "Show me how") */}
              {isIOS && showSteps && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
                    How to install on iOS Safari
                  </p>
                  {[
                    {
                      icon: <ArrowUpFromLine className="h-3.5 w-3.5 text-violet-400" />,
                      text: (
                        <>
                          Tap the{" "}
                          <span className="font-semibold text-foreground">Share</span>{" "}
                          button{" "}
                          <Share className="inline h-3 w-3 text-foreground/60 align-middle" />{" "}
                          at the bottom of Safari
                        </>
                      ),
                    },
                    {
                      icon: <Plus className="h-3.5 w-3.5 text-violet-400" />,
                      text: (
                        <>
                          Scroll down and tap{" "}
                          <span className="font-semibold text-foreground">
                            &quot;Add to Home Screen&quot;
                          </span>
                        </>
                      ),
                    },
                    {
                      icon: <Download className="h-3.5 w-3.5 text-violet-400" />,
                      text: (
                        <>
                          Tap{" "}
                          <span className="font-semibold text-foreground">&quot;Add&quot;</span>{" "}
                          to confirm
                        </>
                      ),
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="shrink-0 h-5 w-5 rounded-full bg-violet-500/10 flex items-center justify-center mt-0.5">
                        {step.icon}
                      </div>
                      <p className="text-xs text-foreground/70 leading-snug">{step.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3">
                {isIOS && showSteps ? (
                  <button
                    onClick={() => dismiss(true)}
                    className="text-xs font-medium text-foreground/50 hover:text-foreground transition-colors duration-200"
                  >
                    Got it, close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-violet-500/25 hover:opacity-90 active:scale-95 transition-all duration-200"
                    >
                      {isNative ? (
                        <><Download className="h-3.5 w-3.5" /> Install App</>
                      ) : (
                        <><Share className="h-3 w-3" /> Show me how</>
                      )}
                    </button>
                    <button
                      onClick={() => dismiss(true)}
                      className="text-xs font-medium text-foreground/40 hover:text-foreground/70 transition-colors duration-200"
                    >
                      Not now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
