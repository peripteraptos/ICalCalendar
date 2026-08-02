<?php

namespace MediaWiki\Extension\ICalCalendar;

class CalendarStore
{

    public const CACHE_SECONDS = 60;
    public array $events = [];
    public bool $loaded = false;

    public function getEvents()
    {
        if (!$this->loaded) {
            if ($this->cacheExists()) {
                $this->loadCache();
            } else {
                $this->fetch();
            }
        }
        return $this->events;
    }

    public function getCategories()
    {
        global $wgCalendarSources;
        return array_map(fn($item) => $item['color'], $wgCalendarSources);
    }

    public function getCacheFilePath()
    {
        return wfTempDir() . "/calendar.json";
    }

    public function fetch()
    {
        global $wgCalendarSources;
        $this->events = [];
        foreach ($wgCalendarSources as $name => $calendar) {
            try {
                $cal = $this->createCalendar($calendar["url"], $name);
                $this->events = array_merge($this->events, $cal->getMappedEvents());
            } catch (\Exception $e) {
                // Log the error and continue with the next calendar
                error_log("Failed to fetch calendar '$name' from URL '{$calendar['url']}': " . $e->getMessage());
                continue;
            }
        }

        $this->saveCache();
    }

    protected function createCalendar($url, $name): Calendar
    {
        return new Calendar($url, $name);
    }

    public function saveCache()
    {
        return file_put_contents($this->getCacheFilePath(), json_encode($this->events));
    }

    public function loadCache()
    {
        return $this->events = json_decode(file_get_contents($this->getCacheFilePath()), true);
    }

    public function cacheOutdated()
    {
        return time() > $this->cacheValidUntil();
    }

    public function cacheValidUntil()
    {
        return filemtime($this->getCacheFilePath()) + self::CACHE_SECONDS;
    }

    public function cacheExists()
    {
        return file_exists($this->getCacheFilePath());
    }
}
