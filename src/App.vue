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
import {
  startOfMonth,
  addMonths,
  format,
  subMonths,
  addDays,
  startOfWeek,
  sub,
  add,
  eachDayOfInterval,
  getDay,
  isToday,
  differenceInCalendarDays,
  isSameDay,
  endOfDay,
  startOfDay,
  parseJSON
} from "date-fns";
import en from "date-fns/locale/en-US";

const API_URL =
  typeof mw !== "undefined"
    ? mw.config.values.wgScriptPath +
      "/api.php?action=query&format=json&prop=&list=calendar"
    : "../calendar.json";

export default {
  data() {
    return {
      currentMonth: startOfMonth(new Date()),
      firstDayOfWeek: startOfWeek(new Date(), {
        locale: en,
        weekStartsOn: 1 // monday
      }),
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
          console.log(startDate, endDate);
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
      console.log(calendar);
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

<style lang="scss">
.mw-ical-calendar {
  $border-color: #a2a9b1;
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
  .cal-loading-spinner {
    /* display:none; */
    position: absolute;
    top: 40%;
    left: 50%;
    margin-left: -18px;
    white-space: nowrap;

    .cal-loading-spinner-bounce,
    &:before,
    &:after {
      content: "";
      background-color: #3366cc;
      display: block;
      float: left;
      width: 12px;
      height: 12px;
      border-radius: 100%;
      -webkit-animation: rcfiltersBouncedelay 1600ms ease-in-out -160ms infinite
        both;
      animation: rcfiltersBouncedelay 1600ms ease-in-out -160ms infinite both;
    }

    &:before {
      margin-right: 4px;
      -webkit-animation-delay: -330ms;
      animation-delay: -330ms;
    }

    &:after {
      margin-left: 4px;
      -webkit-animation-delay: 0s;
      animation-delay: 0s;
    }
  }

  .days,
  .week-days {
    display: grid;

    grid-template-columns: minmax(0, 1fr);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .week-days {
    display: none;
  }

  .week-days p,
  .days .dayN {
    padding: 0.5rem 1rem;
    margin: 0;
    font-weight: bold;
    .short {
      display: none;
    }
  }
  .week-days {
    background: #f8f9fa;
    border: 1px solid #a2a9b1;
    border-top: 0;
    color: black;
  }
  .days {
    background: #f8f9fa;
    border: 1px solid #a2a9b1;
    border-top: 0;
    border-radius: 0 0 3px 3px;
    //height: 80%;
  }

  .day {
    background: white;
  }

  .header {
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
    .calnav {
      button {
        background: white;
        margin-right: 5px;
      }
    }

    .types {
      gap: 0.5em;
      display: flex;
      flex-wrap: wrap;
    }

    input.search {
      flex-grow: 1;
      //width: 100%;
      //max-width: 400px;
      //margin: 0 2em;
    }

    button,
    input {
      box-shadow: none;
      border: 1px solid #a2a9b1;
      border-radius: 3px;
      color: black;
      padding: 0.25rem 0.5rem;
      //margin-right: 5px;
    }
    button {
      cursor: pointer;
    }
    .current {
      margin-left: 1rem;
      font-size: 1.25rem;
      vertical-align: middle;
    }
  }
  .event + .event {
    margin-top: 2px;
  }
  .event {
    background-color: lightblue;
    padding: 3px;
    border-left: 5px solid #0000aa;
    padding-left: 0.75em;
    line-height: 1.4;
    font-size: 0.9em;
    word-break: break-word;
    //border-radius: 5px;
    position: relative;
    color: black;
    .time {
      //margin-bottom: 0.25em;
      font-weight: bold;
      .end {
        font-size: 90%;
        font-weight: normal;
      }
    }
    .description {
      margin-top: 0.25rem;
      font-size: 90%;
      .title {
        font-weight: bold;
        font-size: 110%;
        display: none;
      }
      .time {
        display: none;
        font-size: 90%;
      }
      p {
        padding: 0;
        margin: 0;
        margin-bottom: 0.5rem;
        white-space: pre-wrap;
      }
      div {
        white-space: pre-wrap;
      }
    }
    &.hasDescription {
      cursor: help;
    }
    &.hasDescription:hover .description {
      display: block;
    }
  }
  .day:nth-of-type(-n + 7) .event .description {
    //background-color: blue !important;
    top: 1rem;
    bottom: auto;
  }
  .calendar {
    display: flex;
    flex-direction: column;
    > .days {
      //flex-grow: 1;
    }
  }

  .noEvents {
    text-align: center;
    padding: 3rem 2rem;
    font-size: 1.25rem;
  }

  @media screen and (min-width: 1024px) {
    .days,
    .week-days {
      grid-gap: 1px;
      grid-template-columns: repeat(7, minmax(0, 1fr));
    }
    .week-days {
      display: grid;
    }

    .days {
      .day {
        box-shadow: 0 0 0 1px #d9d9d9;
      }
      .dayN {
        .short {
          display: block;
        }
        .long {
          display: none;
        }
      }
    }

    .event {
      .description {
        .time,
        .title {
          display: block;
        }
        bottom: 1rem;
        display: none;
        position: absolute;
        z-index: 1;
        background: white;
        padding: 1rem;
        border: 1px solid black;

        a {
          display: inline-block;
          white-space: nowrap;
          max-width: min(300px, 90vw);
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1;
          vertical-align: text-bottom;
        }
      }
    }
    .noEvents {
      display: none;
    }
  }

  .has-low-opacity {
    opacity: 0.25;
  }

  @media screen and (max-width: 1024px) {
    .day {
      grid-column-start: unset !important;
    }
    .day:not(.hasDates) {
      display: none;
    }

    .event {
      .description {
        position: ab;
      }
    }
  }

  .Room_schedule {
    border-color: orange;
    background-color: lightyellow;
  }

  .Key_dates {
    border-color: blue;
    background-color: lightblue;
  }

  .Curriculum {
    border-color: green;
    background-color: lightgreen;
  }

  .Lectures {
    border-color: yellow;
    background-color: rgb(255, 255, 220);
  }
}
</style>
