<?php

namespace MediaWiki\Extension\ICalCalendar;

use ICal\ICal;
use ICal\Event;
use \DateTime;

class Calendar
{

	public const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari/537.36';
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
			try {
				$this->ical->initUrl($url, null, null, self::USER_AGENT);
			} catch (\Exception $e) {
				throw new \Exception("Failed to fetch calendar from URL: " . $e->getMessage());
			}
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
