import { addMonths } from "date-fns";
import type { Debt } from "./schema";

export type PayoffStrategy = "snowball" | "avalanche";

export type DebtPayoff = {
  debt: Debt;
  // Infinity when the minimum doesn't cover monthly interest.
  months: number;
  payoffDate: Date | null;
  totalInterest: number;
  paidOffPercent: number | null;
  neverPaysOff: boolean;
};

// Amortized months to zero paying fixed monthlyPayment at given APR.
function monthsToPayoff(
  balance: number,
  apr: number,
  monthlyPayment: number
): number {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;
  const r = apr / 100 / 12;
  if (r <= 0) {
    return Math.ceil(balance / monthlyPayment);
  }
  const monthlyInterest = balance * r;
  if (monthlyPayment <= monthlyInterest) return Infinity;
  const n = -Math.log(1 - (r * balance) / monthlyPayment) / Math.log(1 + r);
  return Math.ceil(n);
}

export function computeDebtPayoff(debt: Debt, now: Date = new Date()): DebtPayoff {
  const months = monthsToPayoff(debt.balance, debt.interestRate, debt.minPayment);
  const neverPaysOff = !Number.isFinite(months);
  const payoffDate = neverPaysOff ? null : addMonths(now, months);
  const totalInterest = neverPaysOff
    ? Infinity
    : debt.minPayment * months - debt.balance;
  const paidOffPercent =
    debt.originalBalance && debt.originalBalance > 0
      ? Math.max(
          0,
          Math.min(100, ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100)
        )
      : null;
  return {
    debt,
    months,
    payoffDate,
    totalInterest,
    paidOffPercent,
    neverPaysOff,
  };
}

export function sortByStrategy(
  payoffs: DebtPayoff[],
  strategy: PayoffStrategy
): DebtPayoff[] {
  const sorted = [...payoffs];
  if (strategy === "snowball") {
    sorted.sort((a, b) => a.debt.balance - b.debt.balance);
  } else {
    sorted.sort((a, b) => b.debt.interestRate - a.debt.interestRate);
  }
  return sorted;
}

export type DebtSummary = {
  totalBalance: number;
  totalMin: number;
  weightedApr: number;
  debtFreeDate: Date | null;
  longestMonths: number;
  anyNeverPaysOff: boolean;
  totalOriginal: number;
  overallPaidOffPercent: number | null;
};

export function summarize(
  debts: Debt[],
  payoffs: DebtPayoff[]
): DebtSummary {
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  const weightedApr =
    totalBalance > 0
      ? debts.reduce((s, d) => s + d.balance * d.interestRate, 0) / totalBalance
      : 0;

  let anyNeverPaysOff = false;
  let longestMonths = 0;
  for (const p of payoffs) {
    if (p.neverPaysOff) {
      anyNeverPaysOff = true;
      continue;
    }
    if (p.months > longestMonths) longestMonths = p.months;
  }
  const debtFreeDate =
    anyNeverPaysOff || payoffs.length === 0
      ? null
      : addMonths(new Date(), longestMonths);

  const totalOriginal = debts.reduce(
    (s, d) => s + (d.originalBalance ?? d.balance),
    0
  );
  const paidOff = totalOriginal - totalBalance;
  const overallPaidOffPercent =
    totalOriginal > 0
      ? Math.max(0, Math.min(100, (paidOff / totalOriginal) * 100))
      : null;

  return {
    totalBalance,
    totalMin,
    weightedApr,
    debtFreeDate,
    longestMonths,
    anyNeverPaysOff,
    totalOriginal,
    overallPaidOffPercent,
  };
}
