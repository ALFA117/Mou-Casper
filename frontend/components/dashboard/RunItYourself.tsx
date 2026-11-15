"use client";

import { ArrowUpRight, Code2, Droplets } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/context";
import { GITHUB_REPO_URL, CASPER_FAUCET_URL, DEPLOYED_CONTRACTS, REDEPLOYED_CONTRACTS } from "@/lib/dashboard-config";
import { truncateHash } from "@/lib/utils";

const EXPLORER_BASE_URL = process.env.NEXT_PUBLIC_CASPER_EXPLORER_URL ?? "https://testnet.cspr.live";

function ContractRow({ name, packageHash }: { name: string; packageHash: string }) {
  return (
    <li>
      <a
        href={`${EXPLORER_BASE_URL}/contract-package/${packageHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-h-11 items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-surface-2"
      >
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="flex items-center gap-1.5 font-mono text-[13px] text-foreground-muted">
          {truncateHash(packageHash, 6, 4)}
          <ArrowUpRight className="size-3.5 text-foreground-faint transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
        </span>
      </a>
    </li>
  );
}

export function RunItYourself() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4] as const;

  return (
    <section id="run-locally" className="panel">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="border-b border-border-subtle p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <h2 className="font-display text-2xl font-semibold text-foreground">{t("runItYourself.title")}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted">{t("runItYourself.thesis")}</p>
          <ol className="mt-5 space-y-3">
            {steps.map(n => (
              <li key={n} className="flex gap-3 text-sm leading-relaxed text-foreground-muted">
                <span className="flex size-6 shrink-0 items-center justify-center rounded border border-border font-mono text-xs text-foreground">
                  {n}
                </span>
                <span>{t(`runItYourself.step${n}` as const)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "md")}>
              <Code2 className="size-4" aria-hidden />
              {t("runItYourself.repoLink")}
            </a>
            <a href={CASPER_FAUCET_URL} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "md")}>
              <Droplets className="size-4" aria-hidden />
              {t("runItYourself.faucetLink")}
            </a>
          </div>
        </div>

        <div className="min-w-0">
          <p className="border-b border-border-subtle px-4 py-3 text-[13px] font-medium text-foreground-muted">
            {t("runItYourself.contractsTitle")}
          </p>
          <ul className="divide-y divide-border-subtle">
            {DEPLOYED_CONTRACTS.map(c => (
              <ContractRow key={c.name} name={c.name} packageHash={c.packageHash} />
            ))}
          </ul>
          <p className="border-y border-border-subtle bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-foreground-muted">
            {t("runItYourself.redeployedTitle")}
          </p>
          <ul className="divide-y divide-border-subtle">
            {REDEPLOYED_CONTRACTS.map(c => (
              <ContractRow key={c.packageHash} name={`${c.name} v2`} packageHash={c.packageHash} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
