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
		$store = new CalendarStore();
		if($store->cacheOutdated()){
			if ( method_exists( MediaWikiServices::class, 'getJobQueueGroup' ) ) {
				// MW 1.37+
				$queue_group = MediaWikiServices::getInstance()->getJobQueueGroup();
			} else {
				$queue_group = JobQueueGroup::singleton();
			}
			$queue_group->push( new ReloadJob() );
		}
		
		$this->getResult()->addValue( null, $this->getModuleName(), $store->getEvents());
	}

    public function getCacheMode( $params ) {
        return 'public';
    }
}
