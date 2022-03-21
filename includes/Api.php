<?php

namespace MediaWiki\Extension\ICalCalendar;

use ApiBase;

class Api extends \ApiQueryBase {

	/**
	 * In this example we're returning one ore more properties
	 * of wgExampleFooStuff. In a more realistic example, this
	 * method would probably
	 */
	public function execute() {
		global $wgExampleFooStuff;
		$params = $this->extractRequestParams();

		$events = [];

		if ( isset( $params['calendar'] ) ) {
			$key = $params['calendar'];
			if ( isset( $wgCalendarSources[$key] ) ) {
				$cal = new Calendar($calendar["url"],$name);
				$events = $cal->getMappedEvents();
			}
		} 

		$this->getResult()->addValue( null, $this->getModuleName(), $events );
	}

	/** @inheritDoc */
	public function getAllowedParams() {
		return [
			'calendar' => [
				ApiBase::PARAM_TYPE => 'string',
			],
		];
	}

	/** @inheritDoc */
	protected function getExamplesMessages() {
		return [
			'action=query&list=example'
				=> 'apihelp-query+example-example-1',
			'action=query&list=example&key=do'
				=> 'apihelp-query+example-example-2',
		];
	}
}
