import { RecurringFrequency } from "@/type";

function addMonthsFromAnchor(anchor: Date, months: number): Date {
    const current = new Date(anchor.getFullYear(), anchor.getMonth() + months, 1);
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    current.setDate(Math.min(anchor.getDate(), lastDay));
    return current;
}

export function advanceRecurrence(date: Date, frequency: RecurringFrequency): Date {
    switch (frequency) {
        case "WEEKLY": {
            const next = new Date(date);
            next.setDate(next.getDate() + 7);
            return next;
        }
        case "YEARLY":
            return addMonthsFromAnchor(date, 12);
        case "MONTHLY":
        default:
            return addMonthsFromAnchor(date, 1);
    }
}

function occurrenceAtStep(startDay: Date, frequency: RecurringFrequency, steps: number): Date {
    switch (frequency) {
        case "WEEKLY": {
            const next = new Date(startDay);
            next.setDate(next.getDate() + 7 * steps);
            return next;
        }
        case "YEARLY":
            return addMonthsFromAnchor(startDay, 12 * steps);
        case "MONTHLY":
        default:
            return addMonthsFromAnchor(startDay, steps);
    }
}

export function nextOccurrences(
    startDate: Date | string,
    frequency: RecurringFrequency,
    endDate: Date | string | null,
    from: Date,
    count = 5
): Date[] {
    const end = endDate ? new Date(endDate) : null;
    const fromDay = new Date(from);
    fromDay.setHours(0, 0, 0, 0);
    const horizon = new Date(fromDay);
    horizon.setDate(horizon.getDate() + 730);

    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);
    const occurrences: Date[] = [];
    let steps = 0;
    let guard = 0;
    while (guard < 2000) {
        const current = occurrenceAtStep(startDay, frequency, steps);
        if (current.getTime() >= fromDay.getTime()) {
            if (end && current.getTime() > end.getTime()) break;
            if (current.getTime() > horizon.getTime()) break;
            occurrences.push(current);
            if (occurrences.length >= count) break;
        } else if (end && current.getTime() > end.getTime()) {
            break;
        }
        steps++;
        guard++;
    }
    return occurrences;
}
