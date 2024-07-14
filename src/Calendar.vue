<template>
  <div class="mw-ical-calendar">
    <div class="cal-loading-spinner" v-if="loading">
      <div class="cal-loading-spinner-bounce"></div>
    </div>
    <div class="calendar" v-else>
      <div class="header">
        <div class="calnav">
          <button class="previousYear" @click="substractOneMonth">&lt;</button>
          <button class="currentPeriod" @click="resetToToday">↺</button>
          <button class="nextYear" @click="addOneMonth">&gt;</button>
          <span class="current">
            {{ format(currentMonth, "MMMM yyyy") }}
          </span>
        </div>
        <input
          type="text"
          placeholder="search events..."
          class="search"
          v-model="searchQuery"
        />
        <div class="types">
          <button
            v-for="calendar in calendars"
            :key="calendar"
            @click="toggleCalendar(calendar)"
            :class="[
              { 'has-low-opacity': hiddenCalendar.includes(calendar) },
              calendar.replace(' ', '_')
            ]"
          >
            {{ calendar }}
          </button>
        </div>
      </div>
      <div class="week-days">
        <p v-for="weekName in weekNames" :key="weekName">{{ weekName }}</p>
      </div>

      <div class="days">
        <div v-if="!currentMonthHasEvent" class="noEvents">
          This month has no events
        </div>
        <div
          v-for="({ day, events }, index) in daysOfCurrentMonth"
          :key="day"
          class="day"
          :class="{ hasDates: events.length > 0 }"
          :style="{
            color: isToday(day) ? 'red' : 'black',
            'grid-column-start': index === 0 ? weekdayOffset : '0' // basically first-child with a param
          }"
        >
          <div class="dayN">
            <span class="short">{{ format(day, "dd") }}</span>
            <span class="long">{{ format(day, "EEEE, dd. MMMM") }}</span>
          </div>
          <div
            v-for="(
              {
                description,
                type,
                startDate,
                endDate,
                title,
                isMultiDay,
                isFirstDay,
                isLastDay
              },
              index
            ) in events"
            :key="index"
            class="event"
            :class="[{ hasDescription: !!description }, type.replace(' ', '_')]"
          >
            <div class="time">
              <template v-if="isMultiDay && !isFirstDay && !isLastDay">
                ➝
              </template>
              <template v-if="!isMultiDay || isFirstDay">{{
                format(startDate, "HH:mm")
              }}</template>
              <span
                :class="{ end: !isMultiDay }"
                v-if="!isMultiDay || isLastDay"
              >
                – {{ format(endDate, "HH:mm") }}</span
              >
            </div>
            <div>{{ title }}</div>
            <div class="description" v-if="!!description">
              <p class="title">{{ title }}</p>
              <p class="time">
                {{ format(startDate, "HH:mm") }} –
                {{ format(endDate, "HH:mm") }}
              </p>
              <div v-html="linkify(description.replace(/\n\s*\n/g, '\n'))" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Get the start of the month for a given date
function startOfMonth(date) {
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

// Add a specified number of months to a date
function addMonths(date, months) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

// Subtract a specified number of months from a date
function subMonths(date, months) {
  return addMonths(date, -months);
}

// Add a specified number of days to a date
function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function format(date, formatStr) {
  const d = new Date(date);

  const map = {
    MMMM: monthNames[d.getMonth()],
    yyyy: d.getFullYear(),
    dd: String(d.getDate()).padStart(2, "0"),
    EEEE: dayNames[d.getDay()],
    MMM: monthNames[d.getMonth()].substr(0, 3),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    yy: String(d.getFullYear()).substr(2),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
    ss: String(d.getSeconds()).padStart(2, "0")
  };

  return formatStr.replace(
    /MMMM|yyyy|dd|EEEE|MMM|MM|yy|HH|mm|ss/g,
    match => map[match]
  );
}

// Get the start of the week for a given date
function startOfWeek(date, weekStartsOn = 7) {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  newDate.setDate(newDate.getDate() - diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

// Subtract a specified duration from a date
function sub(date, { days = 0, months = 0 }) {
  let newDate = new Date(date);
  if (days) {
    newDate = addDays(newDate, -days);
  }
  if (months) {
    newDate = subMonths(newDate, months);
  }
  return newDate;
}

// Add a specified duration to a date
function add(date, { days = 0, months = 0 }) {
  let newDate = new Date(date);
  if (days) {
    newDate = addDays(newDate, days);
  }
  if (months) {
    newDate = addMonths(newDate, months);
  }
  return newDate;
}

// Get each day of an interval between two dates
function eachDayOfInterval({ start, end }) {
  const interval = [];
  let currentDate = new Date(start);
  const endDate = new Date(end);
  while (currentDate <= endDate) {
    interval.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  return interval;
}

// Get the day of the week for a given date
function getDay(date) {
  return new Date(date).getDay();
}

// Check if a given date is today
function isToday(date) {
  const today = new Date();
  const givenDate = new Date(date);
  return (
    today.getDate() === givenDate.getDate() &&
    today.getMonth() === givenDate.getMonth() &&
    today.getFullYear() === givenDate.getFullYear()
  );
}

// Get the difference in calendar days between two dates
function differenceInCalendarDays(dateLeft, dateRight) {
  const startOfDayLeft = startOfDay(dateLeft);
  const startOfDayRight = startOfDay(dateRight);
  const timeDiff = startOfDayLeft - startOfDayRight;
  return Math.round(timeDiff / (1000 * 60 * 60 * 24));
}

// Check if two dates are the same day
function isSameDay(dateLeft, dateRight) {
  const left = new Date(dateLeft);
  const right = new Date(dateRight);
  return (
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear()
  );
}

// Get the end of the day for a given date
function endOfDay(date) {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

// Get the start of the day for a given date
function startOfDay(date) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

// Parse a JSON date string into a Date object
function parseJSON(dateString) {
  return new Date(dateString);
}
const API_URL =
  typeof mw !== "undefined"
    ? mw.config.values.wgScriptPath +
      "/api.php?action=query&format=json&prop=&list=calendar"
    : "../calendar.json";

module.exports = exports = {
  data() {
    return {
      currentMonth: startOfMonth(new Date()),
      firstDayOfWeek: startOfWeek(new Date()),
      dates: [],
      loading: false,
      searchQuery: decodeURI(
        new URL(location.href).hash.substr(1).replaceAll("_", " ")
      ),
      hiddenCalendar: []
    };
  },
  directives: {},
  computed: {
    previousMonth() {
      return startOfMonth(subMonths(new Date(this.currentMonth), 1));
    },
    nextMonth() {
      return startOfMonth(addMonths(new Date(this.currentMonth), 1));
    },
    daysOfCurrentMonth() {
      return eachDayOfInterval({
        start: this.currentMonth,
        end: sub(this.nextMonth, { days: 1 })
      }).map(day => ({
        day,
        events: this.filteredDates.filter(e => isSameDay(e.startDate, day))
      }));
    },
    weekNames() {
      return [...Array(7)].map((_, index) =>
        format(addDays(this.firstDayOfWeek, index), "EEEE")
      );
    },
    weekdayOffset() {
      return (getDay(this.currentMonth) + 7) % 7 || 7; // `|| 7` is basically for sunday, edge case
    },
    currentMonthHasEvent() {
      return (
        this.daysOfCurrentMonth.filter(d => d.events.length > 0).length > 0
      );
    },
    calendars() {
      return [...new Set(this.dates.map(d => d.type))];
    },
    filteredDates() {
      return this.spreadMultidayDates
        .filter(e => !this.hiddenCalendar.includes(e.type))
        .filter(e =>
          e.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
        .slice()
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },
    spreadMultidayDates() {
      return this.dates.reduce((p, c) => {
        const daydiff = differenceInCalendarDays(c.endDate, c.startDate);
        const isMultiDay = daydiff !== 0;
        if (!isMultiDay) return [...p, { ...c, isMultiDay }];
        let dates = [];
        for (let i = 0; i < daydiff; i++) {
          let isFirstDay = i == 0;
          let isLastDay = i == daydiff - 1;
          let startDate = isFirstDay
            ? c.startDate
            : startOfDay(addDays(c.startDate, i));
          let endDate = isLastDay
            ? c.endDate
            : endOfDay(addDays(c.startDate, i));
          dates.push({
            ...c,
            startDate,
            endDate,
            isMultiDay,
            isFirstDay,
            isLastDay
          });
        }
        return [...p, ...dates];
      }, []);
    }
  },
  methods: {
    toggleCalendar(calendar) {
      this.hiddenCalendar = this.hiddenCalendar.includes(calendar)
        ? this.hiddenCalendar.filter(c => c !== calendar)
        : [...this.hiddenCalendar, calendar];
    },
    format,
    isToday,

    substractOneMonth() {
      this.currentMonth = sub(this.currentMonth, { months: 1 });
    },
    addOneMonth() {
      this.currentMonth = add(this.currentMonth, { months: 1 });
    },
    resetToToday() {
      this.currentMonth = startOfMonth(new Date());
    },
    fetchDates() {
      this.loading = true;
      fetch(API_URL)
        .then(res => res.json())
        .then(
          d =>
            (this.dates = d.calendar.map(d => {
              return {
                ...d,
                startDate: parseJSON(d.startDate),
                endDate: parseJSON(d.endDate)
              };
            }))
        )
        .then(() => {
          this.loading = false;
        });
    },
    linkify(string) {
      // http://, https://, ftp://
      var urlPattern =
        /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

      // www. sans http:// or https://
      var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

      // Email addresses
      var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

      return this.sanitize(string)
        .replace(urlPattern, '<a href="$&">$&</a>')
        .replace(pseudoUrlPattern, '$1<a href="http://$2">$2</a>')
        .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>');
    },
    sanitize(string) {
      const map = {
        "&": "&amp;",
        "<": " ",
        ">": " ",
        '"': "&quot;",
        "'": "&#x27;"
        //"/": "&#x2F;"
      };
      const reg = /[&<>"']/gi;
      return string.replace(reg, match => map[match]);
    }
  },
  mounted() {
    this.fetchDates();
  }
};
</script>

<style>
@keyframes rcfiltersBouncedelay {
  0%,
  50%,
  100% {
    transform: scale(0.625);
  }
  20% {
    opacity: 0.87;
    transform: scale(1);
  }
}
.mw-ical-calendar .cal-loading-spinner {
  /* display:none;
	 */
  position: absolute;
  top: 40%;
  left: 50%;
  margin-left: -18px;
  white-space: nowrap;
}
.mw-ical-calendar .cal-loading-spinner .cal-loading-spinner-bounce,
.mw-ical-calendar .cal-loading-spinner:before,
.mw-ical-calendar .cal-loading-spinner:after {
  content: "";
  background-color: #36c;
  display: block;
  float: left;
  width: 12px;
  height: 12px;
  border-radius: 100%;
  -webkit-animation: rcfiltersBouncedelay 1600ms ease-in-out -160ms infinite both;
  animation: rcfiltersBouncedelay 1600ms ease-in-out -160ms infinite both;
}
.mw-ical-calendar .cal-loading-spinner:before {
  margin-right: 4px;
  -webkit-animation-delay: -330ms;
  animation-delay: -330ms;
}
.mw-ical-calendar .cal-loading-spinner:after {
  margin-left: 4px;
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
}
.mw-ical-calendar .days,
.mw-ical-calendar .week-days {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
  text-overflow: ellipsis;
}
.mw-ical-calendar .week-days {
  display: none;
}
.mw-ical-calendar .week-days p,
.mw-ical-calendar .days .dayN {
  padding: 0.5rem 1rem;
  margin: 0;
  font-weight: bold;
}
.mw-ical-calendar .week-days p .short,
.mw-ical-calendar .days .dayN .short {
  display: none;
}
.mw-ical-calendar .week-days {
  background: #f8f9fa;
  border: 1px solid #a2a9b1;
  border-top: 0;
  color: black;
}
.mw-ical-calendar .days {
  background: #f8f9fa;
  border: 1px solid #a2a9b1;
  border-top: 0;
  border-radius: 0 0 3px 3px;
}
.mw-ical-calendar .day {
  background: white;
}
.mw-ical-calendar .header {
  border: 1px solid #a2a9b1;
  border-radius: 3px 3px 0 0;
  flex-wrap: wrap;
  gap: 1em 3em;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  color: black;
}
.mw-ical-calendar .header .calnav button {
  background: white;
  margin-right: 5px;
}
.mw-ical-calendar .header .types {
  gap: 0.5em;
  display: flex;
  flex-wrap: wrap;
}
.mw-ical-calendar .header input.search {
  flex-grow: 1;
}
.mw-ical-calendar .header button,
.mw-ical-calendar .header input {
  box-shadow: none;
  border: 1px solid #a2a9b1;
  border-radius: 3px;
  color: black;
  padding: 0.25rem 0.5rem;
}
.mw-ical-calendar .header button {
  cursor: pointer;
}
.mw-ical-calendar .header .current {
  margin-left: 1rem;
  font-size: 1.25rem;
  vertical-align: middle;
}
.mw-ical-calendar .event + .event {
  margin-top: 2px;
}
.mw-ical-calendar .event {
  background-color: lightblue;
  padding: 3px;
  border-left: 5px solid #00a;
  padding-left: 0.75em;
  line-height: 1.4;
  font-size: 0.9em;
  word-break: break-word;
  position: relative;
  color: black;
}
.mw-ical-calendar .event .time {
  font-weight: bold;
}
.mw-ical-calendar .event .time .end {
  font-size: 90%;
  font-weight: normal;
}
.mw-ical-calendar .event .description {
  margin-top: 0.25rem;
  font-size: 90%;
}
.mw-ical-calendar .event .description .title {
  font-weight: bold;
  font-size: 110%;
  display: none;
}
.mw-ical-calendar .event .description .time {
  display: none;
  font-size: 90%;
}
.mw-ical-calendar .event .description p {
  padding: 0;
  margin: 0;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
}
.mw-ical-calendar .event .description div {
  white-space: pre-wrap;
}
.mw-ical-calendar .event.hasDescription {
  cursor: help;
}
.mw-ical-calendar .event.hasDescription:hover .description {
  display: block;
}
.mw-ical-calendar .day:nth-of-type(-n + 7) .event .description {
  top: 1rem;
  bottom: auto;
}
.mw-ical-calendar .calendar {
  display: flex;
  flex-direction: column;
}
.mw-ical-calendar .noEvents {
  text-align: center;
  padding: 3rem 2rem;
  font-size: 1.25rem;
}
@media screen and (min-width: 1024px) {
  .mw-ical-calendar .days,
  .mw-ical-calendar .week-days {
    grid-gap: 1px;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .mw-ical-calendar .week-days {
    display: grid;
  }
  .mw-ical-calendar .days .day {
    box-shadow: 0 0 0 1px #d9d9d9;
  }
  .mw-ical-calendar .days .dayN .short {
    display: block;
  }
  .mw-ical-calendar .days .dayN .long {
    display: none;
  }
  .mw-ical-calendar .event .description {
    bottom: 1rem;
    display: none;
    position: absolute;
    z-index: 1;
    background: white;
    padding: 1rem;
    border: 1px solid black;
  }
  .mw-ical-calendar .event .description .time,
  .mw-ical-calendar .event .description .title {
    display: block;
  }
  .mw-ical-calendar .event .description a {
    display: inline-block;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
    vertical-align: text-bottom;
  }
  .mw-ical-calendar .noEvents {
    display: none;
  }
}
.mw-ical-calendar .has-low-opacity {
  opacity: 0.25;
}
@media screen and (max-width: 1024px) {
  .mw-ical-calendar .day {
    grid-column-start: unset !important;
  }
  .mw-ical-calendar .day:not(.hasDates) {
    display: none;
  }
  .mw-ical-calendar .event .description {
    position: ab;
  }
}
.mw-ical-calendar .Room_schedule {
  border-color: orange;
  background-color: lightyellow;
}
.mw-ical-calendar .Key_dates {
  border-color: blue;
  background-color: lightblue;
}
.mw-ical-calendar .Curriculum {
  border-color: green;
  background-color: lightgreen;
}
.mw-ical-calendar .Lectures {
  border-color: yellow;
  background-color: #ffffdc;
}
</style>
