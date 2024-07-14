class MiniDate extends Date {
  constructor() {
    super(...arguments);
  }

  // Get the start of the month
  startOfMonth() {
    return new MiniDate(this.getFullYear(), this.getMonth(), 1);
  }

  // Get the end of the month
  endOfMonth() {
    return new MiniDate(this.getFullYear(), this.getMonth() + 1, 0);
  }

  // Add months to the date
  addMonths(n) {
    const date = new MiniDate(this);
    date.setMonth(this.getMonth() + n);
    return date;
  }

  // Subtract months from the date
  subMonths(n) {
    return this.addMonths(-n);
  }

  // Add days to the date
  addDays(n) {
    const date = new MiniDate(this);
    date.setDate(this.getDate() + n);
    return date;
  }

  subDays(n) {
    return this.addDays(-n);
  }

  startOfDay() {
    const date = new MiniDate(this);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  endOfDay() {
    const date = new MiniDate(this);
    date.setHours(23, 59, 59, 59);
    return date;
  }
  // Get the start of the week
  startOfWeek(weekStartsOn = 1) {
    const date = new MiniDate(this);
    const day = date.getDay();
    const diff = day - weekStartsOn;
    return date.subDays(diff);
  }

  // Get the end of the week
  endOfWeek(weekStartsOn = 1) {
    return this.startOfWeek(weekStartsOn).addDays(6);
  }

  // Check if the current object's date is today
  isToday() {
    return this.isSameDay(new Date());
  }

  differenceInCalendarDays(date) {
    const timeDiff = this.startOfDay().getTime() - date.startOfDay().getTime();
    if (timeDiff !== 0) {
      console.log(
        this.startOfDay(),
        date.startOfDay(),
        Math.abs(Math.round(timeDiff / (1000 * 60 * 60 * 24)))
      );
    }
    return Math.abs(Math.round(timeDiff / (1000 * 60 * 60 * 24)));
  }

  isSameDay(dateRight) {
    const left = this;
    const right = new MiniDate(dateRight);
    return (
      left.getDate() === right.getDate() &&
      left.getMonth() === right.getMonth() &&
      left.getFullYear() === right.getFullYear()
    );
  }

  // Format the date
  format(options) {
    // Use Intl.DateTimeFormat to format the date
    const formatter = new Intl.DateTimeFormat("default", options);
    return formatter.format(this);
  }
}

const API_URL =
  typeof mw !== "undefined"
    ? mw.config.values.wgScriptPath +
      "/api.php?action=query&format=json&prop=&list=calendar"
    : "../calendar.json";

class CalendarComponent extends HTMLElement {
  constructor() {
    super();
    let template = document.createElement("template");
    template.innerHTML = `
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
        .mw-ical-calendar{

          position:relative;
          min-height:300px;
        }
        .mw-ical-calendar .cal-loading-spinner {
          transition: all 0.5s ease;
          background-color:#f8f9fa;
          position:absolute;
          pointer-events: none;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;         
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
          -webkit-animation: rcfiltersBouncedelay 1600ms ease-in-out -160ms infinite
            both;
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
          font-size: 0.9em;
          font-weight: normal;
        }
        .mw-ical-calendar .event .description {
          margin-top: 0.25rem;
          font-size: 0.9em;
        }
        .mw-ical-calendar .event .description .title {
          font-weight: bold;
          font-size: 1.1em;
          display: none;
        }
        .mw-ical-calendar .event .description .time {
          display: none;
          font-size: 0.9em;
        }
        .mw-ical-calendar .event .description p {
          padding: 0;
          margin: 0;
          margin-bottom: 0.5rem;
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
      <div class="mw-ical-calendar">
        <div class="cal-loading-spinner" id="loading-spinner">
          <div class="cal-loading-spinner-bounce"></div>
        </div>
        <div class="calendar" id="calendar-content">
          <div class="header">
            <div class="calnav">
              <button class="previousYear" id="substractOneMonth">&lt;</button>
              <button class="currentPeriod" id="resetToToday">↺</button>
              <button class="nextYear" id="addOneMonth">&gt;</button>
              <span class="current" id="currentMonth"></span>
            </div>
            <input
              type="text"
              placeholder="search events..."
              class="search"
              id="searchQuery"
            />
            <div class="types" id="calendarTypes"></div>
          </div>
          <div class="week-days" id="weekNames"></div>
          <div class="days" id="daysOfCurrentMonth"></div>
        </div>
      </div>`;
    template = template.content;
    this.attachShadow({ mode: "open" }).appendChild(template.cloneNode(true));
    this.state = {
      currentDate: new MiniDate(),
      dates: [],
      loading: false,
      searchQuery: decodeURI(
        new URL(location.href).hash.slice(1).replaceAll("_", " ")
      ),
      hiddenCalendar: []
    };
  }

  connectedCallback() {
    this.init();
    this.fetchDates();
  }

  init() {
    this.shadowRoot
      .getElementById("substractOneMonth")
      .addEventListener("click", () => this.substractOneMonth());
    this.shadowRoot
      .getElementById("addOneMonth")
      .addEventListener("click", () => this.addOneMonth());
    this.shadowRoot
      .getElementById("resetToToday")
      .addEventListener("click", () => this.resetToToday());
    this.shadowRoot.getElementById("searchQuery").value =
      this.state.searchQuery;
    this.shadowRoot
      .getElementById("searchQuery")
      .addEventListener("input", e => {
        this.state.searchQuery = e.target.value;
        window.history.replaceState(undefined, "", "#" + e.target.value);
        this.render();
      });
  }

  fetchDates() {
    this.state.loading = true;
    this.render();

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        this.state.dates = data.calendar.map(d => ({
          ...d,
          startDate: new MiniDate(d.startDate),
          endDate: new MiniDate(d.endDate)
        }));
        this.state.loading = false;
        console.log(this.state.dates);
        this.render();
      });
  }

  substractOneMonth() {
    this.state.currentDate = this.state.currentDate.subMonths(1);
    this.render();
  }

  addOneMonth() {
    this.state.currentDate = this.state.currentDate.addMonths(1);
    this.render();
  }

  resetToToday() {
    this.state.currentDate = new MiniDate();
    this.render();
  }

  toggleCalendar(calendar) {
    this.state.hiddenCalendar = this.state.hiddenCalendar.includes(calendar)
      ? this.state.hiddenCalendar.filter(c => c !== calendar)
      : [...this.state.hiddenCalendar, calendar];
    this.render();
  }

  render() {
    const loadingSpinner = this.shadowRoot.getElementById("loading-spinner");
    const calendarContent = this.shadowRoot.getElementById("calendar-content");

    // Manage display of elements based on loading state
    if (this.state.loading) {
      loadingSpinner.style.opacity = "1";
    } else {
      loadingSpinner.style.opacity = "0";

      // Set the text for the current month
      const currentMonthEl = this.shadowRoot.getElementById("currentMonth");
      currentMonthEl.textContent = this.state.currentDate.format({
        month: "long",
        year: "numeric"
      });

      // Create week day names elements
      const weekNamesEl = this.shadowRoot.getElementById("weekNames");
      weekNamesEl.textContent = ""; // Clear existing content
      this.weekNames.forEach(weekName => {
        const p = document.createElement("p");
        p.textContent = weekName;
        weekNamesEl.appendChild(p);
      });

      // Create calendar type buttons
      const calendarTypesEl = this.shadowRoot.getElementById("calendarTypes");
      calendarTypesEl.innerHTML = ""; // Clear existing content
      this.calendars.forEach(calendar => {
        const button = document.createElement("button");
        button.className = `${
          this.state.hiddenCalendar.includes(calendar) ? "has-low-opacity" : ""
        } ${calendar.replace(" ", "_")}`;
        button.onclick = () => this.toggleCalendar(calendar);
        button.textContent = calendar;
        calendarTypesEl.appendChild(button);
      });

      // Create elements for days of the current month
      const daysOfCurrentMonthEl =
        this.shadowRoot.getElementById("daysOfCurrentMonth");
      daysOfCurrentMonthEl.innerHTML = ""; // Clear existing content
      this.daysOfCurrentMonth.forEach(({ day, events }, index) => {
        const dayDiv = document.createElement("div");
        dayDiv.className = `day ${events.length > 0 ? "hasDates" : ""}`;
        dayDiv.style.color = day.isToday() ? "red" : "black";
        dayDiv.style.gridColumnStart = index === 0 ? this.weekdayOffset : "0";

        const dayN = document.createElement("div");
        dayN.className = "dayN";

        const shortSpan = document.createElement("span");
        shortSpan.className = "short";
        shortSpan.textContent = day.format({ day: "numeric" });
        dayN.appendChild(shortSpan);

        const longSpan = document.createElement("span");
        longSpan.className = "long";
        longSpan.textContent = day.format({
          weekday: "long",
          day: "numeric",
          month: "long"
        });
        dayN.appendChild(longSpan);

        dayDiv.appendChild(dayN);

        events.forEach(event => {
          const eventDiv = document.createElement("div");
          eventDiv.className = `event ${event.type.replace(" ", "_")} ${
            event.description ? "hasDescription" : ""
          }`;

          const timeDiv = document.createElement("div");
          timeDiv.className = "time";

          if (!event.isMultiDay) {
            timeDiv.textContent = `${event.startDate.format({
              hour: "numeric",
              minute: "numeric",
              hour12: false
            })} - ${event.endDate.format({
              hour: "numeric",
              minute: "numeric",
              hour12: false
            })}`;
          } else if (event.isFirstDay) {
            timeDiv.textContent = `${event.startDate.format({
              hour: "numeric",
              minute: "numeric",
              hour12: false
            })} ➝`;
          } else if (event.isLastDay) {
            timeDiv.textContent = `➝ ${event.endDate.format({
              hour: "numeric",
              minute: "numeric",
              hour12: false
            })}`;
          } else {
            timeDiv.textContent = "➝";
          }
          eventDiv.appendChild(timeDiv);

          const titleDiv = document.createElement("div");
          titleDiv.textContent = event.title;
          eventDiv.appendChild(titleDiv);

          if (event.description) {
            const descriptionDiv = document.createElement("div");
            descriptionDiv.className = "description";

            const descTitleP = document.createElement("p");
            descTitleP.className = "title";
            descTitleP.textContent = event.title;
            descriptionDiv.appendChild(descTitleP);

            const descTimeP = document.createElement("p");
            descTimeP.className = "time";
            descTimeP.textContent = `${event.startDate.format({
              hour: "numeric",
              minute: "numeric",
              hour12: false
            })} – ${event.endDate.format({
              hour: "numeric",
              minute: "numeric",
              hour12: false
            })}`;
            descriptionDiv.appendChild(descTimeP);

            const descTextDiv = document.createElement("div");
            descTextDiv.innerHTML = this.linkify(
              event.description.replace(/\n\s*\n/g, "\n")
            ); // Use innerHTML carefully only for trusted content
            descriptionDiv.appendChild(descTextDiv);

            eventDiv.appendChild(descriptionDiv);
          }

          dayDiv.appendChild(eventDiv);
        });

        daysOfCurrentMonthEl.appendChild(dayDiv);
      });
    }
  }

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
  }
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

  get daysOfCurrentMonth() {
    const d = this.eachDayOfInterval({
      start: this.state.currentDate.startOfMonth().startOfWeek(),
      end: this.state.currentDate.endOfMonth().endOfWeek()
    }).map(day => ({
      day,
      events: this.filteredDates.filter(e => e.startDate.isSameDay(day))
    }));
    console.log(d);
    return d;
  }

  eachDayOfInterval({ start, end }) {
    const interval = [];
    let currentDate = new MiniDate(start);
    const endDate = new MiniDate(end);
    while (currentDate <= endDate) {
      interval.push(new MiniDate(currentDate));
      currentDate = currentDate.addDays(1);
    }
    return interval;
  }

  get weekNames() {
    return [...Array(7)].map((_, index) =>
      new MiniDate().startOfWeek().addDays(index).format({ weekday: "long" })
    );
  }

  get weekdayOffset() {
    return this.state.currentDate.startOfWeek().getDay() + (7 % 7) || 7;
  }

  get currentMonthHasEvent() {
    return this.daysOfCurrentMonth.some(d => d.events.length > 0);
  }

  get calendars() {
    return [...new Set(this.state.dates.map(d => d.type))];
  }

  get filteredDates() {
    return this.spreadMultidayDates
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .filter(e => !this.state.hiddenCalendar.includes(e.type))
      .filter(e =>
        e.title.toLowerCase().includes(this.state.searchQuery.toLowerCase())
      );
  }

  get spreadMultidayDates() {
    return this.state.dates.reduce((p, c) => {
      const daydiff = c.startDate.differenceInCalendarDays(c.endDate);
      const isMultiDay = daydiff !== 0;
      if (!isMultiDay) return [...p, { ...c, isMultiDay }];
      let dates = [];
      for (let i = 0; i <= daydiff; i++) {
        let isFirstDay = i == 0;
        let isLastDay = i == daydiff;
        let startDate = isFirstDay
          ? c.startDate
          : c.startDate.addDays(i).startOfDay();
        let endDate = isLastDay ? c.endDate : c.startDate.addDays(i).endOfDay();
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
}

customElements.define("calendar-component", CalendarComponent);
