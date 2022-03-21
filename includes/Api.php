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
		global $wgCalendarSources;
		$params = $this->extractRequestParams();

		$events = [];
		foreach($wgCalendarSources as $name => $calendar){
			$cal = new Calendar($calendar["url"],$name);
			array_push($events, ...$cal->getMappedEvents());
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
	

	public function getCacheMode($params){
		return "public";
	}
}
