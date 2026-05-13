/** Расчёт графиков платежей (логика из payment-schedules.html). */

export type PaymentScheduleType = 'standard' | 'discount' | 'barter' | 'installment' | 'custom';

export type StoredScheduleLine = {
  n: number;
  dateIso: string;
  description: string;
  amount: number;
};

/** Сохранённый график (один активный на квартиру — при создании нового заменяется). */
export type PaymentScheduleRecord = {
  id: string;
  clientId: string;
  aptId: string;
  scheduleType: PaymentScheduleType;
  totalPrice: number;
  finalPrice: number;
  details: string;
  lines: StoredScheduleLine[];
  createdAt: string;
};

export type PreviewPaymentLine = {
  number: number;
  date: Date;
  description: string;
  amount: number;
};

export type StandardParams = {
  totalPrice: number;
  startDate: Date;
  initialPercent: number;
  paymentsCount: number;
};

export type DiscountParams = {
  totalPrice: number;
  startDate: Date;
  discountPercent: number;
  initialPercent: number;
  paymentsCount: number;
};

export type BarterParams = {
  totalPrice: number;
  startDate: Date;
  barterValue: number;
  paymentsCount: number;
  propertyDescription: string;
};

export type InstallmentParams = {
  totalPrice: number;
  startDate: Date;
  initialPercent: number;
  months: number;
};

export type CustomParams = {
  totalPrice: number;
  startDate: Date;
  initialAmount: number;
  paymentsCount: number;
};

function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function calculateStandard(p: StandardParams): PreviewPaymentLine[] {
  const { totalPrice, startDate, initialPercent, paymentsCount } = p;
  const initialAmount = totalPrice * (initialPercent / 100);
  const remainingAmount = totalPrice - initialAmount;
  const regularPayment = remainingAmount / Math.max(1, paymentsCount - 1);

  const payments: PreviewPaymentLine[] = [];
  payments.push({
    number: 1,
    date: new Date(startDate),
    description: `Первоначальный взнос (${initialPercent}%)`,
    amount: initialAmount,
  });

  for (let i = 1; i < paymentsCount; i++) {
    const paymentDate = addMonths(startDate, i * 2);
    payments.push({
      number: i + 1,
      date: paymentDate,
      description: i === paymentsCount - 1 ? 'Финальный платёж' : `Платёж ${i}`,
      amount: regularPayment,
    });
  }

  return payments;
}

export function calculateDiscount(p: DiscountParams): PreviewPaymentLine[] {
  const { totalPrice, startDate, discountPercent, initialPercent, paymentsCount } = p;
  const discountedPrice = totalPrice * (1 - discountPercent / 100);
  const initialAmount = discountedPrice * (initialPercent / 100);
  const remainingAmount = discountedPrice - initialAmount;
  const regularPayment = remainingAmount / Math.max(1, paymentsCount - 1);

  const payments: PreviewPaymentLine[] = [];
  payments.push({
    number: 1,
    date: new Date(startDate),
    description: `Первоначальный взнос (${initialPercent}%) со скидкой ${discountPercent}%`,
    amount: initialAmount,
  });

  for (let i = 1; i < paymentsCount; i++) {
    const paymentDate = addMonths(startDate, i * 2);
    payments.push({
      number: i + 1,
      date: paymentDate,
      description: i === paymentsCount - 1 ? 'Финальный платёж' : `Платёж ${i}`,
      amount: regularPayment,
    });
  }

  return payments;
}

export function calculateBarter(p: BarterParams): PreviewPaymentLine[] {
  const { totalPrice, startDate, barterValue, paymentsCount, propertyDescription } = p;
  const property = propertyDescription.trim() || 'Имущество';
  const remainingAmount = Math.max(0, totalPrice - barterValue);
  const regularPayment = paymentsCount > 0 ? remainingAmount / paymentsCount : 0;

  const payments: PreviewPaymentLine[] = [];
  payments.push({
    number: 1,
    date: new Date(startDate),
    description: `Зачёт: ${property}`,
    amount: barterValue,
  });

  for (let i = 0; i < paymentsCount; i++) {
    const paymentDate = addMonths(startDate, i + 1);
    payments.push({
      number: i + 2,
      date: paymentDate,
      description: i === paymentsCount - 1 ? 'Финальный платёж' : `Платёж ${i + 1}`,
      amount: regularPayment,
    });
  }

  return payments;
}

/** Полный список ежемесячных платежей (без сокращений «…»). */
export function calculateInstallment(p: InstallmentParams): PreviewPaymentLine[] {
  const { totalPrice, startDate, initialPercent, months } = p;
  const initialAmount = totalPrice * (initialPercent / 100);
  const remainingAmount = totalPrice - initialAmount;
  const monthlyPayment = months > 0 ? remainingAmount / months : 0;

  const payments: PreviewPaymentLine[] = [];
  let num = 1;
  payments.push({
    number: num++,
    date: new Date(startDate),
    description: `Первоначальный взнос (${initialPercent}%)`,
    amount: initialAmount,
  });

  let scheduled = 0;
  for (let i = 1; i <= months; i++) {
    const paymentDate = addMonths(startDate, i);
    const isLast = i === months;
    const amt = isLast ? remainingAmount - scheduled : monthlyPayment;
    scheduled += amt;
    payments.push({
      number: num++,
      date: paymentDate,
      description: `Ежемесячный платёж ${i}/${months}`,
      amount: Math.max(0, amt),
    });
  }

  return payments;
}

export function calculateCustom(p: CustomParams): PreviewPaymentLine[] {
  const { totalPrice, startDate, initialAmount, paymentsCount } = p;
  const remainingAmount = Math.max(0, totalPrice - initialAmount);
  const regularPayment = paymentsCount > 0 ? remainingAmount / paymentsCount : 0;

  const payments: PreviewPaymentLine[] = [];
  let num = 1;

  if (initialAmount > 0) {
    payments.push({
      number: num++,
      date: new Date(startDate),
      description: 'Первоначальный взнос',
      amount: initialAmount,
    });
  }

  for (let i = 0; i < paymentsCount; i++) {
    const paymentDate = addMonths(startDate, (i + 1) * 3);
    payments.push({
      number: num++,
      date: paymentDate,
      description: i === paymentsCount - 1 ? 'Финальный платёж' : `Платёж ${i + 1}`,
      amount: regularPayment,
    });
  }

  return payments;
}

export function previewLinesToStored(lines: PreviewPaymentLine[]) {
  return lines.map((l) => ({
    n: l.number,
    dateIso: l.date.toISOString().slice(0, 10),
    description: l.description,
    amount: l.amount,
  }));
}

export function sumLines(lines: { amount: number }[]): number {
  return lines.reduce((s, l) => s + l.amount, 0);
}

/** Распределение зафиксированных платежей по строкам графика (FIFO). */
export function allocatePaidFifo(
  lineAmounts: number[],
  payments: { amount: number; submittedAt: string }[],
): boolean[] {
  const sorted = [...payments].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );
  let pool = sorted.reduce((s, p) => s + p.amount, 0);
  return lineAmounts.map((amt) => {
    if (pool >= amt - 1e-6) {
      pool -= amt;
      return true;
    }
    return false;
  });
}

export function scheduleTypeLabel(t: PaymentScheduleType): string {
  const names: Record<PaymentScheduleType, string> = {
    standard: 'Стандартный',
    discount: 'Со скидкой',
    barter: 'Бартер',
    installment: 'Рассрочка 0%',
    custom: 'Индивидуальный',
  };
  return names[t] ?? t;
}

export function computeFinalPriceAndDetails(
  type: PaymentScheduleType,
  totalPrice: number,
  opts: {
    discountPercent?: number;
    barterValue?: number;
    installmentMonths?: number;
    customNote?: string;
  },
): { finalPrice: number; details: string } {
  switch (type) {
    case 'discount': {
      const dp = opts.discountPercent ?? 0;
      return {
        finalPrice: totalPrice * (1 - dp / 100),
        details: `Скидка ${dp}%`,
      };
    }
    case 'barter': {
      const bv = opts.barterValue ?? 0;
      return {
        finalPrice: Math.max(0, totalPrice - bv),
        details: `Зачёт имущества: ${bv.toLocaleString('ru-RU')} ₽`,
      };
    }
    case 'installment': {
      const m = opts.installmentMonths ?? 0;
      return {
        finalPrice: totalPrice,
        details: `Рассрочка ${m} мес., 0%`,
      };
    }
    case 'custom':
      return {
        finalPrice: totalPrice,
        details: opts.customNote?.trim() || 'Индивидуальные условия',
      };
    default:
      return { finalPrice: totalPrice, details: 'Стандартные условия' };
  }
}
