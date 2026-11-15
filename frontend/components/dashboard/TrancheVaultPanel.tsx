"use client";

import { useMemo, useState } from "react";
import { Layers, ShieldCheck, Flame, UserRound } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
const TOTAL_FACE_VALUE_CSPR = SENIOR_FACE_VALUE_CSPR + JUNIOR_FACE_VALUE_CSPR;

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

  const buys = useMemo(() => runLog.filter((e): e is InvestorBuyRunEntry => e.type === "investor_buy"), [runLog]);
  const lastSeniorBuy = [...buys].reverse().find(b => b.entryPoint === "buy_senior");
  const lastJuniorBuy = [...buys].reverse().find(b => b.entryPoint === "buy_junior");

  const vault = chainState?.vault;

  return (
    <Card className="" id="vault">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded border border-border bg-surface-2 text-foreground">
            <Layers className="size-[18px]" aria-hidden />
          </div>
          <div className="max-w-[62ch]">
            <p className="kicker lg:hidden">03 · {t("step.vault")}</p>
            <CardTitle className="text-xl">TrancheVault</CardTitle>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground-muted">{t("vault.description")}</p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Estructura de capital: ancho proporcional al valor nominal real de cada tramo. */}
        <div>
          <p className="text-[13px] text-foreground-faint">{t("vault.capitalStack")}</p>
          <div className="mt-2 flex h-3 w-full gap-[3px] overflow-hidden rounded-sm" aria-hidden>
            <StackSegment share={SENIOR_FACE_VALUE_CSPR / TOTAL_FACE_VALUE_CSPR} filled={fill(vault?.seniorOutstandingCspr, SENIOR_FACE_VALUE_CSPR)} tone="senior" />
            <StackSegment share={JUNIOR_FACE_VALUE_CSPR / TOTAL_FACE_VALUE_CSPR} filled={fill(vault?.juniorOutstandingCspr, JUNIOR_FACE_VALUE_CSPR)} tone="brand" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrancheBlock
            icon={ShieldCheck}
            labelKey="vault.seniorLabel"
            subKey="vault.seniorSub"
            tone="senior"
            tooltipKey="vault.seniorTooltip"
            outstandingCspr={vault?.seniorOutstandingCspr ?? null}
            faceValueCspr={SENIOR_FACE_VALUE_CSPR}
          />
          <TrancheBlock
            icon={Flame}
            labelKey="vault.juniorLabel"
            subKey="vault.juniorSub"
            tone="junior"
            tooltipKey="vault.juniorTooltip"
            outstandingCspr={vault?.juniorOutstandingCspr ?? null}
            faceValueCspr={JUNIOR_FACE_VALUE_CSPR}
          />
        </div>

        <div className="rounded border border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
            <div className="flex items-center gap-2.5">
              <UserRound className="size-4 text-foreground-faint" aria-hidden />
              <span className="text-sm font-medium text-foreground">{t("vault.investorAgent")}</span>
            </div>
            <span className="text-[13px] text-foreground-faint">{t("vault.holdingsTitle")}</span>
          </div>
          <dl className="grid grid-cols-2 border-b border-border-subtle text-sm">
            <div className="border-r border-border-subtle px-4 py-3">
              <dt className="text-foreground-muted">Senior</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                {vault ? <CountUp value={vault.investorHoldingSeniorCspr} decimals={2} suffix=" CSPR" /> : "— CSPR"}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-foreground-muted">Junior</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                {vault ? <CountUp value={vault.investorHoldingJuniorCspr} decimals={2} suffix=" CSPR" /> : "— CSPR"}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-1 gap-3 bg-surface-2 px-4 py-3 sm:grid-cols-2">
            <BuyRow
              id="buy-senior"
              label={t("vault.seniorInputLabel")}
              amount={seniorAmount}
              onAmount={setSeniorAmount}
              disabled={actionsDisabled}
              tooltip={readOnlyTooltip}
              loading={busyAction === "buy_senior"}
              onBuy={() => onBuySenior(seniorAmount)}
              text={t("vault.buySenior", { cost: ACTION_COST_ESTIMATES_CSPR.investTranche })}
            />
            <BuyRow
              id="buy-junior"
              label={t("vault.juniorInputLabel")}
              amount={juniorAmount}
              onAmount={setJuniorAmount}
              disabled={actionsDisabled}
              tooltip={readOnlyTooltip}
              loading={busyAction === "buy_junior"}
              onBuy={() => onBuyJunior(juniorAmount)}
              text={t("vault.buyJunior", { cost: ACTION_COST_ESTIMATES_CSPR.investTranche })}
            />
          </div>

          {(lastSeniorBuy || lastJuniorBuy) && (
            <div className="flex flex-col gap-1 border-t border-border-subtle px-4 py-3 text-[13px] text-foreground-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
              {lastSeniorBuy && (
                <span className="flex flex-wrap items-center gap-x-1.5">
                  {t("vault.lastSeniorBuy", { amount: formatCspr(lastSeniorBuy.amountCspr, 0) })}
                  <TxLink hash={lastSeniorBuy.hash} />
                </span>
              )}
              {lastJuniorBuy && (
                <span className="flex flex-wrap items-center gap-x-1.5">
                  {t("vault.lastJuniorBuy", { amount: formatCspr(lastJuniorBuy.amountCspr, 0) })}
                  <TxLink hash={lastJuniorBuy.hash} />
                </span>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function fill(outstanding: number | undefined, face: number): number | null {
  if (typeof outstanding !== "number") return null;
  return Math.max(0, Math.min(1, outstanding / Math.max(1, face)));
}

function StackSegment({ share, filled, tone }: { share: number; filled: number | null; tone: "senior" | "brand" }) {
  return (
    <div className="relative h-full bg-surface-3" style={{ flexGrow: share, flexBasis: 0 }}>
      {filled !== null && (
        <div
          className={cn("h-full transition-[width] duration-700", tone === "senior" ? "bg-senior" : "bg-brand")}
          style={{ width: `${filled * 100}%` }}
        />
      )}
    </div>
  );
}

function BuyRow({
  id,
  label,
  amount,
  onAmount,
  disabled,
  tooltip,
  loading,
  onBuy,
  text,
}: {
  id: string;
  label: string;
  amount: number;
  onAmount: (v: number) => void;
  disabled: boolean;
  tooltip?: string;
  loading: boolean;
  onBuy: () => void;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={1}
        value={amount}
        onChange={e => onAmount(Number(e.target.value) || 0)}
        disabled={disabled}
        className="field w-20"
      />
      <span title={tooltip} className="min-w-0 flex-1">
        <Button size="sm" variant="secondary" onClick={onBuy} disabled={disabled} loading={loading} className="w-full">
          {text}
        </Button>
      </span>
    </div>
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
  outstandingCspr: number | null; // null = todavia no hay lectura de la cadena
  faceValueCspr: number;
}) {
  const { t } = useI18n();
  const label = t(labelKey);
  const wiped = outstandingCspr !== null && outstandingCspr <= 0;
  const senior = tone === "senior";
  return (
    <div className={cn("rounded border p-4", wiped ? "border-brand bg-brand-dim" : "border-border")}>
      <div className={cn("flex items-center gap-1.5 text-[15px] font-semibold", senior ? "text-senior-glow" : "text-brand-glow")}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
        {tooltipKey && <InfoTooltip label={t("tooltip.whatIs", { term: label })}>{t(tooltipKey)}</InfoTooltip>}
      </div>
      <p className="mt-1 text-[13px] text-foreground-muted">{t(subKey)}</p>
      <p className="mt-0.5 font-mono text-xs text-foreground-faint">{t("vault.faceValue", { amount: formatCspr(faceValueCspr, 0) })}</p>
      <p className="mt-4 font-mono text-2xl font-semibold tabular-nums text-foreground">
        {outstandingCspr === null ? "—" : <CountUp value={outstandingCspr} decimals={3} />}
        <span className="ml-1.5 text-sm font-normal text-foreground-faint">CSPR</span>
      </p>
      <p className="text-[13px] text-foreground-faint">{t("vault.outstanding")}</p>
      {wiped && <p className="mt-2 text-[13px] font-medium text-brand-glow">{t("vault.wiped")}</p>}
    </div>
  );
}
