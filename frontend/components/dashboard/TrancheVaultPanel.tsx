"use client";

import { useMemo, useState } from "react";
import { Layers, ShieldCheck, Flame, UserRound } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TxLink } from "@/components/ui/TxLink";
import { CountUp } from "@/components/ui/CountUp";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ChainState, RunLogEntry, InvestorBuyRunEntry } from "@/lib/types";
import { ACTION_COST_ESTIMATES_CSPR } from "@/lib/dashboard-config";
import { cn, formatCspr } from "@/lib/utils";

// Valores nominales fijados al deploy de TrancheVault (Paso 5, init()) —
// no son mock, son los argumentos reales del constructor ya en cadena.
const SENIOR_FACE_VALUE_CSPR = 100;
const JUNIOR_FACE_VALUE_CSPR = 50;

export function TrancheVaultPanel({
  chainState,
  runLog,
  busyAction,
  actionsDisabled,
  readOnlyTooltip,
  onBuySenior,
  onBuyJunior,
}: {
  chainState: ChainState | null;
  runLog: RunLogEntry[];
  busyAction: string | null;
  actionsDisabled: boolean;
  readOnlyTooltip?: string;
  onBuySenior: (amountCspr: number) => void;
  onBuyJunior: (amountCspr: number) => void;
}) {
  const { t } = useI18n();
  const [seniorAmount, setSeniorAmount] = useState(15);
  const [juniorAmount, setJuniorAmount] = useState(10);

  const buys = useMemo(
    () => runLog.filter((e): e is InvestorBuyRunEntry => e.type === "investor_buy"),
    [runLog]
  );
  const lastSeniorBuy = [...buys].reverse().find(b => b.entryPoint === "buy_senior");
  const lastJuniorBuy = [...buys].reverse().find(b => b.entryPoint === "buy_junior");

  const vault = chainState?.vault;

  return (
    <Card accent="brand" className="scroll-mt-24" id="vault">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand-glow">
            <Layers className="size-4" aria-hidden />
          </div>
          <div>
            <CardTitle>TrancheVault</CardTitle>
            <p className="text-xs text-foreground-muted">{t("vault.description")}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TrancheBlock
              icon={ShieldCheck}
              labelKey="vault.seniorLabel"
              subKey="vault.seniorSub"
              tone="senior"
              tooltipKey="vault.seniorTooltip"
              outstandingCspr={vault?.seniorOutstandingCspr ?? SENIOR_FACE_VALUE_CSPR}
              faceValueCspr={SENIOR_FACE_VALUE_CSPR}
            />
            <TrancheBlock
              icon={Flame}
              labelKey="vault.juniorLabel"
              subKey="vault.juniorSub"
              tone="junior"
              tooltipKey="vault.juniorTooltip"
              outstandingCspr={vault?.juniorOutstandingCspr ?? JUNIOR_FACE_VALUE_CSPR}
              faceValueCspr={JUNIOR_FACE_VALUE_CSPR}
            />
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-2/60 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-3 text-foreground-muted">
                <UserRound className="size-4" aria-hidden />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{t("vault.investorAgent")}</div>
                <div className="font-mono text-xs tabular-nums text-foreground-muted">
                  {t("vault.holdingsPrefix")}{" "}
                  <CountUp value={vault?.investorHoldingSeniorCspr ?? 0} decimals={2} suffix=" CSPR" />{" "}
                  {t("vault.holdingsMiddle")}{" "}
                  <CountUp value={vault?.investorHoldingJuniorCspr ?? 0} decimals={2} suffix=" CSPR" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={seniorAmount}
                  onChange={e => setSeniorAmount(Number(e.target.value) || 0)}
                  disabled={actionsDisabled}
                  className="h-9 w-20 rounded-lg border border-border-subtle bg-surface px-2 text-xs text-foreground disabled:opacity-50"
                  aria-label={t("vault.seniorInputLabel")}
                />
                <span title={readOnlyTooltip} className="flex-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onBuySenior(seniorAmount)}
                    disabled={actionsDisabled}
                    loading={busyAction === "buy_senior"}
                    className="w-full"
                  >
                    {t("vault.buySenior", { cost: ACTION_COST_ESTIMATES_CSPR.investTranche })}
                  </Button>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={juniorAmount}
                  onChange={e => setJuniorAmount(Number(e.target.value) || 0)}
                  disabled={actionsDisabled}
                  className="h-9 w-20 rounded-lg border border-border-subtle bg-surface px-2 text-xs text-foreground disabled:opacity-50"
                  aria-label={t("vault.juniorInputLabel")}
                />
                <span title={readOnlyTooltip} className="flex-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onBuyJunior(juniorAmount)}
                    disabled={actionsDisabled}
                    loading={busyAction === "buy_junior"}
                    className="w-full"
                  >
                    {t("vault.buyJunior", { cost: ACTION_COST_ESTIMATES_CSPR.investTranche })}
                  </Button>
                </span>
              </div>
            </div>

            {(lastSeniorBuy || lastJuniorBuy) && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
                {lastSeniorBuy && (
                  <span>
                    {t("vault.lastSeniorBuy", { amount: formatCspr(lastSeniorBuy.amountCspr, 0) })}{" "}
                    <TxLink hash={lastSeniorBuy.hash} />
                  </span>
                )}
                {lastJuniorBuy && (
                  <span>
                    {t("vault.lastJuniorBuy", { amount: formatCspr(lastJuniorBuy.amountCspr, 0) })}{" "}
                    <TxLink hash={lastJuniorBuy.hash} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function TrancheBlock({
  icon: Icon,
  labelKey,
  subKey,
  tone,
  tooltipKey,
  outstandingCspr,
  faceValueCspr,
}: {
  icon: typeof ShieldCheck;
  labelKey: TranslationKey;
  subKey: TranslationKey;
  tone: "senior" | "junior";
  tooltipKey?: TranslationKey;
  outstandingCspr: number;
  faceValueCspr: number;
}) {
  const { t } = useI18n();
  const label = t(labelKey);
  const wiped = outstandingCspr <= 0;
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors duration-500",
        tone === "senior" ? "border-senior/30 bg-senior/5" : "border-junior/30 bg-junior/5",
        wiped && "border-danger/50 bg-danger/10"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className={cn("flex items-center gap-1.5 text-sm font-semibold", tone === "senior" ? "text-senior-glow" : "text-junior-glow")}>
          <Icon className="size-4" aria-hidden />
          {label}
          {tooltipKey && <InfoTooltip label={t("tooltip.whatIs", { term: label })}>{t(tooltipKey)}</InfoTooltip>}
        </div>
        <Badge variant={tone}>{t("vault.faceValue", { amount: formatCspr(faceValueCspr, 0) })}</Badge>
      </div>
      <p className="mb-3 text-xs text-foreground-muted">{t(subKey)}</p>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
          <CountUp value={outstandingCspr} decimals={3} suffix=" CSPR" />
        </span>
        <span className="text-xs text-foreground-faint">{t("vault.outstanding")}</span>
      </div>
      <ProgressBar value={outstandingCspr} max={faceValueCspr || 1} tone={wiped ? "danger" : tone} />
      {wiped && <div className="mt-2 text-xs font-medium text-danger-glow">{t("vault.wiped")}</div>}
    </div>
  );
}
