<?php
namespace MediaWiki\Extension\ICalCalendar;

use ICal\ICal;
use \DateTime;

class Calendar{

	public $ical;
	public $name;
	public $url;

	public function __construct($url, $name){
		$this->name = $name;
		$this->url = $url;
		$this->ical = new ICal(false, array(
			'defaultSpan'                 => 2,     // Default value
			'defaultTimeZone'             => 'UTC',
			'defaultWeekStart'            => 'MO',  // Default value
			'disableCharacterReplacement' => false, // Default value
			'filterDaysAfter'             => null,  // Default value
			'filterDaysBefore'            => null,  // Default value
			'skipRecurrence'              => false, // Default value
		));
	      // $ical->initFile('ICal.ics');
	       $this->ical->initUrl($url, null, null, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:53.0) Gecko/20100101 Firefox/53.0');
	}

	public function toJson(){
		return json_encode($this->getMappedEvents());
	}

	public function getEvents()
	{
		return $this->ical->sortEventsWithOrder($this->ical->events());
	}

	public function getMappedEvents()
	{
		return array_map(function($event) {return [
                    'id' => $event->uid,
                    'type' => $this->name,
                    'title' => $event->summary,
                    'startDate' => $this->ical->iCalDateToDateTime($event->dtstart_array[3])->format(DateTime::ATOM),
                    'endDate' => $this->ical->iCalDateToDateTime($event->dtend_array[3])->format(DateTime::ATOM),
                    'description' => $event->description,
                    'location' => $event->location,
                    'isRecurring' => property_exists($event,'rrule'),
	            //'url' => $this->url,
                  ];}, $this->getEvents());
	}
}
