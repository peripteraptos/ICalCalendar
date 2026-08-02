import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Calendar from "./Calendar.vue";

function mountCalendar() {
  return mount(Calendar);
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ calendar: [], categories: {}, validUntil: null })
      })
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("format", () => {
  it.each([
    ["MMMM", "2026-08-02T05:06:07", "August"],
    ["yyyy", "2026-08-02T05:06:07", "2026"],
    ["dd", "2026-08-02T05:06:07", "02"],
    ["EEEE", "2026-08-02T05:06:07", "Sunday"],
    ["MMM", "2026-08-02T05:06:07", "Aug"],
    ["MM", "2026-08-02T05:06:07", "08"],
    ["yy", "2026-08-02T05:06:07", "26"],
    ["HH", "2026-08-02T05:06:07", "05"],
    ["mm", "2026-08-02T05:06:07", "06"],
    ["ss", "2026-08-02T05:06:07", "07"]
  ])("formats token %s", async (token, date, expected) => {
    const wrapper = mountCalendar();
    expect(wrapper.vm.format(date, token)).toBe(expected);
  });

  it("formats composite template strings", () => {
    const wrapper = mountCalendar();
    const date = "2026-08-02T05:06:07";
    expect(wrapper.vm.format(date, "MMMM yyyy")).toBe("August 2026");
    expect(wrapper.vm.format(date, "HH:mm")).toBe("05:06");
    expect(wrapper.vm.format(date, "EEEE, dd. MMMM")).toBe(
      "Sunday, 02. August"
    );
  });
});

describe("weekdayOffset", () => {
  it.each([
    ["2026-08-03", 1], // Monday
    ["2026-08-04", 2], // Tuesday
    ["2026-08-05", 3], // Wednesday
    ["2026-08-06", 4], // Thursday
    ["2026-08-07", 5], // Friday
    ["2026-08-08", 6] // Saturday
  ])("is %s -> %i for non-Sunday weekdays", (date, expected) => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date(date);
    expect(wrapper.vm.weekdayOffset).toBe(expected);
  });

  it("falls back to 7 (not 0) for Sunday", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date("2026-08-02"); // Sunday
    expect(wrapper.vm.weekdayOffset).toBe(7);
  });
});

describe("spreadMultidayDates", () => {
  it("does not split a single-day event", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = [
      {
        id: "1",
        type: "Cal",
        title: "Single",
        startDate: "2026-08-02T09:00:00",
        endDate: "2026-08-02T10:00:00"
      }
    ];
    const result = wrapper.vm.spreadMultidayDates;
    expect(result).toHaveLength(1);
    expect(result[0].isMultiDay).toBe(false);
    expect(result[0].isFirstDay).toBeUndefined();
    expect(result[0].isLastDay).toBeUndefined();
  });

  it("produces two segments for a 2-calendar-day event, one per calendar day", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = [
      {
        id: "1",
        type: "Cal",
        title: "Overnight",
        startDate: "2026-08-02T22:00:00",
        endDate: "2026-08-03T02:00:00"
      }
    ];
    const result = wrapper.vm.spreadMultidayDates;
    expect(result).toHaveLength(2);
    expect(result.every(r => r.isMultiDay)).toBe(true);

    // First segment: Aug 2, from the real start until end of that day.
    expect(result[0].isFirstDay).toBe(true);
    expect(result[0].isLastDay).toBe(false);
    expect(result[0].startDate).toBe("2026-08-02T22:00:00");
    expect(result[0].endDate).toEqual(new Date(2026, 7, 2, 23, 59, 59, 999));

    // Second segment: Aug 3, from start of that day until the real end.
    expect(result[1].isFirstDay).toBe(false);
    expect(result[1].isLastDay).toBe(true);
    expect(result[1].startDate).toEqual(new Date(2026, 7, 3, 0, 0, 0, 0));
    expect(result[1].endDate).toBe("2026-08-03T02:00:00");
  });

  it("produces one segment per calendar day for a 3-calendar-day event", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = [
      {
        id: "1",
        type: "Cal",
        title: "Conference",
        startDate: "2026-08-02T09:00:00",
        endDate: "2026-08-04T17:00:00"
      }
    ];
    const result = wrapper.vm.spreadMultidayDates;
    // The event spans 3 calendar days (2nd, 3rd, 4th) - each must get its
    // own segment so it renders in its own day cell.
    expect(result).toHaveLength(3);

    expect(result[0].isFirstDay).toBe(true);
    expect(result[0].isLastDay).toBe(false);
    expect(result[0].startDate).toBe("2026-08-02T09:00:00");
    expect(result[0].endDate).toEqual(new Date(2026, 7, 2, 23, 59, 59, 999));

    expect(result[1].isFirstDay).toBe(false);
    expect(result[1].isLastDay).toBe(false);
    expect(result[1].startDate).toEqual(new Date(2026, 7, 3, 0, 0, 0, 0));
    expect(result[1].endDate).toEqual(new Date(2026, 7, 3, 23, 59, 59, 999));

    expect(result[2].isFirstDay).toBe(false);
    expect(result[2].isLastDay).toBe(true);
    expect(result[2].startDate).toEqual(new Date(2026, 7, 4, 0, 0, 0, 0));
    expect(result[2].endDate).toBe("2026-08-04T17:00:00");
  });
});

describe("filteredDates", () => {
  function baseDates() {
    return [
      {
        id: "1",
        type: "Work",
        title: "Team sync",
        startDate: "2026-08-05T09:00:00",
        endDate: "2026-08-05T09:30:00"
      },
      {
        id: "2",
        type: "Personal",
        title: "Dentist appointment",
        startDate: "2026-08-03T09:00:00",
        endDate: "2026-08-03T10:00:00"
      },
      {
        id: "3",
        type: "Work",
        title: "Sprint planning",
        startDate: "2026-08-04T09:00:00",
        endDate: "2026-08-04T10:00:00"
      }
    ];
  }

  it("hides events whose type is in hiddenCalendar", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = baseDates();
    wrapper.vm.hiddenCalendar = ["Work"];
    expect(wrapper.vm.filteredDates.map(e => e.id)).toEqual(["2"]);
  });

  it("filters by case-insensitive substring match on title", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = baseDates();
    wrapper.vm.searchQuery = "SPRINT";
    expect(wrapper.vm.filteredDates.map(e => e.id)).toEqual(["3"]);
  });

  it("returns nothing for a non-matching search query", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = baseDates();
    wrapper.vm.searchQuery = "nonexistent";
    expect(wrapper.vm.filteredDates).toEqual([]);
  });

  it("sorts ascending by startDate", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = baseDates();
    expect(wrapper.vm.filteredDates.map(e => e.id)).toEqual(["2", "3", "1"]);
  });

  it("combines hidden-calendar filter, search filter, and sort", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = baseDates();
    wrapper.vm.hiddenCalendar = ["Personal"];
    wrapper.vm.searchQuery = "s";
    // "Personal" hidden removes id 2; remaining titles containing "s":
    // "Team sync" (1), "Sprint planning" (3)
    expect(wrapper.vm.filteredDates.map(e => e.id)).toEqual(["3", "1"]);
  });
});

describe("daysOfCurrentMonth / weekNames / month navigation / calendars", () => {
  it("returns the correct number of days for a known month", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date(2026, 1, 1); // Feb 2026, 28 days
    expect(wrapper.vm.daysOfCurrentMonth).toHaveLength(28);
  });

  it("only attaches events matching that exact day", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date(2026, 7, 1);
    wrapper.vm.dates = [
      {
        id: "1",
        type: "Cal",
        title: "Event",
        startDate: "2026-08-05T09:00:00",
        endDate: "2026-08-05T10:00:00"
      }
    ];
    const day5 = wrapper.vm.daysOfCurrentMonth.find(
      d => d.day.getDate() === 5
    );
    const day6 = wrapper.vm.daysOfCurrentMonth.find(
      d => d.day.getDate() === 6
    );
    expect(day5.events).toHaveLength(1);
    expect(day6.events).toHaveLength(0);
  });

  it("weekNames returns Sunday through Saturday given the default firstDayOfWeek", () => {
    const wrapper = mountCalendar();
    expect(wrapper.vm.weekNames).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ]);
  });

  it("rolls over from December to January for nextMonth", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date(2026, 11, 1);
    expect(wrapper.vm.nextMonth).toEqual(new Date(2027, 0, 1));
  });

  it("rolls over from January to December for previousMonth", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date(2026, 0, 1);
    expect(wrapper.vm.previousMonth).toEqual(new Date(2025, 11, 1));
  });

  it("currentMonthHasEvent is false with no dates and true once one is in-range", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date(2026, 7, 1);
    expect(wrapper.vm.currentMonthHasEvent).toBe(false);
    wrapper.vm.dates = [
      {
        id: "1",
        type: "Cal",
        title: "Event",
        startDate: "2026-08-10T09:00:00",
        endDate: "2026-08-10T10:00:00"
      }
    ];
    expect(wrapper.vm.currentMonthHasEvent).toBe(true);
  });

  it("calendars returns unique types in first-occurrence order", () => {
    const wrapper = mountCalendar();
    wrapper.vm.dates = [
      { id: "1", type: "B", title: "", startDate: "2026-08-01", endDate: "2026-08-01" },
      { id: "2", type: "A", title: "", startDate: "2026-08-02", endDate: "2026-08-02" },
      { id: "3", type: "B", title: "", startDate: "2026-08-03", endDate: "2026-08-03" }
    ];
    expect(wrapper.vm.calendars).toEqual(["B", "A"]);
  });
});

describe("methods", () => {
  it("toggleCalendar adds then removes a calendar from hiddenCalendar", () => {
    const wrapper = mountCalendar();
    wrapper.vm.toggleCalendar("Work");
    expect(wrapper.vm.hiddenCalendar).toEqual(["Work"]);
    wrapper.vm.toggleCalendar("Work");
    expect(wrapper.vm.hiddenCalendar).toEqual([]);
  });

  it("substractOneMonth and addOneMonth mutate currentMonth by exactly one month", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date(2026, 7, 1);
    wrapper.vm.addOneMonth();
    expect(wrapper.vm.currentMonth).toEqual(new Date(2026, 8, 1));
    wrapper.vm.substractOneMonth();
    wrapper.vm.substractOneMonth();
    expect(wrapper.vm.currentMonth).toEqual(new Date(2026, 6, 1));
  });

  it("resetToToday resets currentMonth to the start of the current month", () => {
    const wrapper = mountCalendar();
    wrapper.vm.currentMonth = new Date("2020-01-01");
    wrapper.vm.resetToToday();
    const now = new Date();
    expect(wrapper.vm.currentMonth.getFullYear()).toBe(now.getFullYear());
    expect(wrapper.vm.currentMonth.getMonth()).toBe(now.getMonth());
    expect(wrapper.vm.currentMonth.getDate()).toBe(1);
  });

  it("isToday is true for now and false for yesterday/tomorrow", () => {
    const wrapper = mountCalendar();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(wrapper.vm.isToday(now)).toBe(true);
    expect(wrapper.vm.isToday(yesterday)).toBe(false);
    expect(wrapper.vm.isToday(tomorrow)).toBe(false);
  });
});

describe("sanitize", () => {
  it.each([
    ["&", "&amp;"],
    ["<", " "],
    [">", " "],
    ['"', "&quot;"],
    ["'", "&#x27;"]
  ])("escapes %s", (input, expected) => {
    const wrapper = mountCalendar();
    expect(wrapper.vm.sanitize(input)).toBe(expected);
  });

  it("escapes all special characters combined", () => {
    const wrapper = mountCalendar();
    expect(wrapper.vm.sanitize(`<a href="x">it's & done</a>`)).toBe(
      ' a href=&quot;x&quot; it&#x27;s &amp; done /a '
    );
  });

  it("passes through a string with no special characters unchanged", () => {
    const wrapper = mountCalendar();
    expect(wrapper.vm.sanitize("plain text 123")).toBe("plain text 123");
  });

  it("returns an empty string unchanged", () => {
    const wrapper = mountCalendar();
    expect(wrapper.vm.sanitize("")).toBe("");
  });
});

describe("linkify", () => {
  it("neutralizes a <script> XSS payload via sanitize before linkifying", () => {
    const wrapper = mountCalendar();
    const result = wrapper.vm.linkify("<script>alert(1)</script>");
    expect(result).not.toContain("<script>");
  });

  it("neutralizes an onerror-attribute XSS payload", () => {
    const wrapper = mountCalendar();
    const result = wrapper.vm.linkify('<img src=x onerror=alert(1)>');
    expect(result).not.toContain("<img");
  });

  it("autolinks a bare https URL", () => {
    const wrapper = mountCalendar();
    const result = wrapper.vm.linkify("see https://example.com for info");
    expect(result).toContain(
      '<a href="https://example.com">https://example.com</a>'
    );
  });

  it("autolinks a bare www. address without a protocol", () => {
    const wrapper = mountCalendar();
    const result = wrapper.vm.linkify("visit www.example.com today");
    expect(result).toContain(
      '<a href="http://www.example.com">www.example.com</a>'
    );
  });

  it("autolinks a bare email address", () => {
    const wrapper = mountCalendar();
    const result = wrapper.vm.linkify("contact me@example.com");
    expect(result).toContain(
      '<a href="mailto:me@example.com">me@example.com</a>'
    );
  });

  it("composes escaping, URL-linking and email-linking together", () => {
    const wrapper = mountCalendar();
    const result = wrapper.vm.linkify(
      "Tom & Jerry: https://example.com or me@example.com"
    );
    expect(result).toContain("Tom &amp; Jerry");
    expect(result).toContain(
      '<a href="https://example.com">https://example.com</a>'
    );
    expect(result).toContain(
      '<a href="mailto:me@example.com">me@example.com</a>'
    );
  });

  it("excludes a trailing sentence period from the linked URL", () => {
    // The final required character class in urlPattern excludes `.`, so a
    // URL at the end of a sentence does NOT swallow its trailing period.
    const wrapper = mountCalendar();
    const result = wrapper.vm.linkify("Go to https://example.com/page.");
    expect(result).toBe(
      'Go to <a href="https://example.com/page">https://example.com/page</a>.'
    );
  });
});
