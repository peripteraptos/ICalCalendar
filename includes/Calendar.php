<?php

namespace MediaWiki\Extension\ICalCalendar;

use ICal\ICal;
use ICal\Event;
use \DateTime;

class Calendar
{

	public ?ICal $ical;
	public string $name;
	public string $url;

	public function __construct($url, $name, ?ICal $ical = null)
	{
		$this->name = $name;
		$this->url = $url;
		$this->ical = $ical ?? new ICal(false, array(
			'defaultSpan'                 => 2,     // Default value
			'defaultTimeZone'             => 'UTC',
			'defaultWeekStart'            => 'MO',  // Default value
			'disableCharacterReplacement' => false, // Default value
			'filterDaysAfter'             => null,  // Default value
			'filterDaysBefore'            => null,  // Default value
			'skipRecurrence'              => false, // Default value
		));
		if ($ical === null) {
			$this->ical->initUrl($url, null, null, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:53.0) Gecko/20100101 Firefox/53.0');
		}
	}

	public function toJson()
	{
		return json_encode($this->getMappedEvents());
	}

	public function getEvents()
	{
		return $this->ical->sortEventsWithOrder($this->ical->events());
	}

	public function getMappedEvents()
	{
		return array_map(function (Event $event) {
			print_r($event);
			print_r(array_keys(get_object_vars($event)));
			print_r(property_exists($event, 'rrule') ? "Recurring" : "Not Recurring");
			print_r("\n");
			return [
				'id' => $event->uid,
				'type' => $this->name,
				'title' => $event->summary,
				'startDate' => $this->ical->iCalDateToDateTime($event->dtstart_array[3])->format(DateTime::ATOM),
				'endDate' => $this->ical->iCalDateToDateTime($event->dtend_array[3])->format(DateTime::ATOM),
				'description' => $event->description,
				'location' => $event->location,
				'isRecurring' => isset($event->additionalProperties['rrule']),
				//				'url' => $this->url,
			];
		}, $this->getEvents());
	}
}
