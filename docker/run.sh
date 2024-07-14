#!/bin/sh
cd /var/www/html;
php maintenance/install.php \
    --dbtype=sqlite \
    --server="http://wiki.localhost" \
    --lang=en \
    --scriptpath="" \
    --pass=Adminpassword \
    "Wiki Name" "Admin";
php maintenance/update.php;
cat << EOF >> /var/www/html/LocalSettings.php
error_reporting( -1 );
ini_set( 'display_errors', 1 );
\$wgShowSQLErrors = true;
\$wgDebugDumpSql  = true;
\$wgDebugLogFile = '/var/www/html/mediawikidebug.log';
\$wgShowDBErrorBacktrace = true;
\$wgDebugToolbar = true;
\$wgShowExceptionDetails=true; 
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
EOF
chmod -R 777 data
chmod -R 777 images
apache2-foreground