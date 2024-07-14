# ICalCalendar

To install the extention, place a copy of it in the extensions folder and adjust your LocalSettings.php

```
# Load Extension
wfLoadExtension( 'ICalCalendar' );

# iCalCalendar
\$wgCalendarSources = [
    "New Zeazland Holiday" => [
        "url" => "https://calendar.google.com/calendar/ical/en.new_zealand%23holiday%40group.v.calendar.google.com/public/basic.ics",
        "color" => "#ffa500"
    ],
    "US Holiday" => [
        "url" => "https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics",
        "color" => "#0000ff"
    ],
    "German Holidays" => [
        "url" => "https://www.officeholidays.com/ics-all/germany",
        "color" => "#008000"
    ],
    "North Korean Holidays" => [
        "url" => "https://www.officeholidays.com/ics-all/north-korea",
        "color" => "#ffff00"
    ],
    "Ghana Holidays" => [
        "url" => "https://www.officeholidays.com/ics-all/ghana",
        "color" => "#ff00ff"
    ]
];
```
