"use client";

import { Code2, Droplets, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/lib/i18n/context";
import { GITHUB_REPO_URL, CASPER_FAUCET_URL, DEPLOYED_CONTRACTS } from "@/lib/dashboard-config";

const EXPLORER_BASE_URL = process.env.NEXT_PUBLIC_CASPER_EXPLORER_URL ?? "https://testnet.cspr.live";

export function RunItYourself() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4] as const;

  return (
    <Card accent="none" className="mt-6">
      <CardHeader>
        <div>
          <CardTitle>{t("runItYourself.title")}</CardTitle>
          <p className="text-xs text-foreground-muted">{t("runItYourself.thesis")}</p>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <ol className="space-y-2 text-xs text-foreground-muted">
          {steps.map(n => (
            <li key={n} className="flex gap-2">
              <span className="font-mono text-foreground-faint">{n}.</span>
              <span>{t(`runItYourself.step${n}` as const)}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
            <Badge variant="neutral" className="cursor-pointer hover:brightness-110">
              <Code2 className="size-3" aria-hidden />
              {t("runItYourself.repoLink")}
            </Badge>
          </a>
          <a href={CASPER_FAUCET_URL} target="_blank" rel="noopener noreferrer">
            <Badge variant="brand" className="cursor-pointer hover:brightness-110">
              <Droplets className="size-3" aria-hidden />
              {t("runItYourself.faucetLink")}
            </Badge>
          </a>
        </div>

        <div className="border-t border-border-subtle pt-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
            {t("runItYourself.contractsTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            {DEPLOYED_CONTRACTS.map(c => (
              <a
                key={c.name}
                href={`${EXPLORER_BASE_URL}/contract-package/${c.packageHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="carbon" className="cursor-pointer hover:brightness-110">
                  {c.name}
                  <ExternalLink className="size-3" aria-hidden />
                </Badge>
              </a>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
