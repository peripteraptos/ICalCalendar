<?php
namespace MediaWiki\Extension\ICalCalendar;

class CalendarStore {

    public const CACHE_SECONDS = 3600;
    public array $events = [];
    public bool $loaded = false;

    public function getEvents(){
        if(!$this->loaded){
            if($this->cacheExists()){
                $this->loadCache();
            }else{
                $this->fetch();
            }
        }
        return $this->events;
    }

    public function getCacheFilePath(){
        return wfTempDir()."/calendar.json";
    }

    public function fetch(){
        global $wgCalendarSources;
        $this->events = [];
        foreach($wgCalendarSources as $name => $calendar){
            $cal = new Calendar($calendar["url"],$name);
            array_push($this->events, ...$cal->getMappedEvents());
        }

        $this->saveCache();
    }

    public function saveCache(){
        return file_put_contents($this->getCacheFilePath(), json_encode($this->events));
    }

    public function loadCache(){
        return $this->events = json_decode(file_get_contents($this->getCacheFilePath()),true);
    }

    public function cacheOutdated(){
        return time()-filemtime($this->getCacheFilePath()) > self::CACHE_SECONDS;
    }

    public function cacheExists(){
        return file_exists($this->getCacheFilePath());
    }

}