<template>
  <div class="calendar" :class="{ 'is-loading': loading }">
    <div class="header">
      <button class="previousYear" @click="substractOneMonth">&lt;</button>
      <button class="currentPeriod" @click="resetToToday">↺</button>
      <button class="nextYear" @click="addOneMonth">&gt;</button>
      <span class="current">
        {{ format(currentMonth, "MMMM yyyy") }}
      </span>
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
            { description, type, startDate, endDate, title }, index
          ) in events"
          :key="index"
          class="event"
          :class="[{ hasDescription: !!description }, type]"
        >
          <div class="time">
            {{ format(startDate, "HH:mm") }}
            <span class="end"> – {{ format(endDate, "HH:mm") }}</span>
          </div>
          <div>{{ title }}</div>
          <div class="description" v-if="!!description">
            <p class="title">{{ title }}</p>
            <p class="time">
              {{ format(startDate, "HH:mm") }} – {{ format(endDate, "HH:mm") }}
            </p>
            <div v-html="linkify(description)" />
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
  isSameDay,
  parseJSON
} from "date-fns";
import en from "date-fns/locale/en-US";

const API_URL =
  typeof mw !== "undefined"
    ? mw.config.values.wgScriptPath +
      "/api.php?action=query&format=json&prop=&list=calendar"
    : "/calendar.json";

export default {
  data() {
    return {
      currentMonth: startOfMonth(new Date()),
      firstDayOfWeek: startOfWeek(new Date(), {
        locale: en,
        weekStartsOn: 1 // monday
      }),
      dates: [],
      loading: false
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
        events: this.dates.filter(e => isSameDay(e.startDate, day))
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
    }
  },
  methods: {
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
.calendar {
  position: relative;
  > * {
    transition: filter 0.2s ease;
  }
  &.is-loading {
    > * {
      filter: blur(8px);
    }
    &::after {
      filter: none;
      top: calc(50% - 25px);
      left: calc(50% - 25px);
      position: absolute;
      content: "";
      border: 10px solid #f3f3f3;
      border-top: 10px solid #3498db;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 0.5s linear infinite;
      z-index: 2;
    }
  }
}

.days,
.week-days {
  display: grid;
  grid-gap: 1px;
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
  background: lightslategray;
  color: white;
}
.days {
  background: #f0f0f0;
  p {
  }
}
#app,
#app > div,
html,
body {
  height: 100%;
  margin: 0;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica,
    sans-serif;
}

.days {
  height: 80%;
}

.day {
  background: white;
}

.header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.75rem 1rem;
  background: lightslategray;
  color: white;
  button {
    background: transparent;
    box-shadow: none;
    border: 1px solid white;
    color: white;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    margin-right: 5px;
  }
  .current {
    margin-left: 1rem;
    font-size: 1.25rem;
  }
}
.event {
  background-color: lightblue;
  padding: 3px;
  border-left: 5px solid #0000aa;
  padding-left: 1em;
  line-height: 1.5;
  font-size: 0.9em;
  //border-radius: 5px;
  margin-bottom: 2px;
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
    flex-grow: 1;
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
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .week-days {
    display: grid;
  }

  .days {
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
        max-width: 170px;
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

.event.RoomSchedule {
  border-color: orange;
  background-color: lightyellow;
}

.event.KeyDates {
  border-color: blue;
  background-color: lightblue;
}

.event.Curriculum {
  border-color: green;
  background-color: lightgreen;
}

.event.Lectures {
  border-color: yellow;
  background-color: rgb(255, 255, 220);
}
</style>
