import { Zap, Sparkles, Boxes } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

const STACK_BADGES = [
  {
    icon: Zap,
    label: "x402 micropayments",
    tooltip:
      "x402 is an HTTP-native payment protocol: an agent pays a tiny amount of crypto per API call to unlock a paid response — no accounts, no invoices, just a 402 Payment Required handled automatically.",
  },
  { icon: Sparkles, label: "Gemini 2.5 Flash" },
  { icon: Boxes, label: "Casper Testnet" },
];

/**
 * First thing a judge reads — plain English, no jargon, states the thesis
 * before any of the numbered steps. Everything it claims is demonstrated
 * live below (real x402 payments, real LLM quotes, real on-chain slashing).
 */
export function Hero() {
  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-6 shadow-glow sm:p-8">
      <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
        AI underwriters that <span className="text-brand-glow">bleed</span>{" "}when they&apos;re wrong.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        Two AI agents underwrite the same real-world invoice batch — each pays for risk data, quotes it
        with a live LLM, and stakes its own CSPR behind the call. When the batch defaults, whichever agent
        mispriced the risk gets <span className="text-foreground">sliced on-chain</span> — stake seized,
        reputation destroyed, in front of everyone. Nothing below is simulated: every transaction is
        verifiable right now on Casper Testnet.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {STACK_BADGES.map(({ icon: Icon, label, tooltip }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/80 px-3 py-1.5 text-xs font-medium text-foreground-muted"
          >
            <Icon className="size-3.5 text-brand-glow" aria-hidden />
            {label}
            {tooltip && <InfoTooltip label={`Qué es ${label}`}>{tooltip}</InfoTooltip>}
          </span>
        ))}
      </div>
    </section>
  );
}
