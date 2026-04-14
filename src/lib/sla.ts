/**
 * SLA calculation based on business days/hours.
 * Business hours: 8:00 - 17:00 (9 hours = 540 minutes per day)
 * Only weekdays (Mon-Fri) count.
 */

const EXPEDIENTE_INICIO = 8; // 8:00
const EXPEDIENTE_FIM = 17;   // 17:00
const MINUTOS_POR_DIA = (EXPEDIENTE_FIM - EXPEDIENTE_INICIO) * 60; // 540

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function adjustToNextBusinessTime(date: Date): Date {
  const d = new Date(date);
  // Move to next weekday if weekend
  while (!isWeekday(d)) {
    d.setDate(d.getDate() + 1);
    d.setHours(EXPEDIENTE_INICIO, 0, 0, 0);
  }
  // If before business hours, set to start
  if (d.getHours() < EXPEDIENTE_INICIO) {
    d.setHours(EXPEDIENTE_INICIO, 0, 0, 0);
  }
  // If after business hours, move to next business day
  if (d.getHours() >= EXPEDIENTE_FIM) {
    d.setDate(d.getDate() + 1);
    d.setHours(EXPEDIENTE_INICIO, 0, 0, 0);
    while (!isWeekday(d)) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

export function calculateSLA(
  startDate: Date,
  prazoPrioridade: number,
  prazoTipoSuporte: number
): Date {
  const prazoDias = Math.min(prazoPrioridade, prazoTipoSuporte);
  let remainingMinutes = prazoDias * MINUTOS_POR_DIA;

  let current = adjustToNextBusinessTime(new Date(startDate));

  while (remainingMinutes > 0) {
    const endOfDay = new Date(current);
    endOfDay.setHours(EXPEDIENTE_FIM, 0, 0, 0);

    const minutesLeftToday = Math.floor((endOfDay.getTime() - current.getTime()) / 60000);

    if (remainingMinutes <= minutesLeftToday) {
      current = new Date(current.getTime() + remainingMinutes * 60000);
      remainingMinutes = 0;
    } else {
      remainingMinutes -= minutesLeftToday;
      current.setDate(current.getDate() + 1);
      current.setHours(EXPEDIENTE_INICIO, 0, 0, 0);
      current = adjustToNextBusinessTime(current);
    }
  }

  return current;
}
