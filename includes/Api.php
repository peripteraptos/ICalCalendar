<?php

namespace MediaWiki\Extension\ICalCalendar;

use ApiBase;
use ApiQueryBase;


class Api extends ApiQueryBase {

	/**
	 * @param \ApiQuery $query
	 * @param string $moduleName
	 */
	public function __construct( $query, $moduleName ) {
		parent::__construct( $query, $moduleName, 'calendar' );
	}

	/**
	 * In this example we're returning one ore more properties
	 * of wgExampleFooStuff. In a more realistic example, this
	 * method would probably
	 */
	public function execute() {
		global $wgCalendarSources;
		$params = $this->extractRequestParams();

		$events = [];
		foreach($wgCalendarSources as $name => $calendar){
			$cal = new Calendar($calendar["url"],$name);
			array_push($events, ...$cal->getMappedEvents());
		}

		$this->getResult()->addValue( null, $this->getModuleName(), $events );
	}

    public function getCacheMode( $params ) {
        return 'public';
    }
}
