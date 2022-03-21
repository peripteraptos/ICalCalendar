<?php
use ICal\ICal;


class EDParserICAL extends EDParserBase{
	/** @var bool $keepExternalVarsCase Whether external variables' names are case-sensitive for this format. */
	public $keepExternalVarsCase = true;

	/**
	 * Parse the text. Called as $parser( $text ) as syntactic sugar.
	 *
	 * @param string $text The text to be parsed.
	 *
	 * @return array A two-dimensional column-based array of the parsed values.
	 *
	 */
	public function __invoke( $text ) {

		$ical = new ICal(false, array(
		  'defaultSpan'                 => 2,     // Default value
		  'defaultTimeZone'             => 'UTC',
		  'defaultWeekStart'            => 'MO',  // Default value
		  'disableCharacterReplacement' => false, // Default value
		  'filterDaysAfter'             => null,  // Default value
		  'filterDaysBefore'            => null,  // Default value
		  'skipRecurrence'              => false, // Default value
	      ));

		$ical->initString($text);
		$events = $ical->sortEventsWithOrder($ical->events());
		$mapped = array_map(function($event) use($ical){return [
		    'id' => $event->uid,
//		    'type' => $type,
		    'title' => $event->summary,
		    'startDate' => $ical->iCalDateToDateTime($event->dtstart_array[3])->format(DateTime::ATOM),
		    'endDate' => $ical->iCalDateToDateTime($event->dtend_array[3])->format(DateTime::ATOM),
		    'description' => $event->description,
		    'location' => $event->location,
		    'isRecurring' => property_exists($event,'rrule')
//		    'url' => $url,
		  ];}, $events);

		$values = parent::__invoke( $text );
	
		$values['__text'] = [ json_encode($mapped) ];
		return $values;
	}
}
