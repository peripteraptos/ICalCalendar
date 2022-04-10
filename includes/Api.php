<?php

namespace MediaWiki\Extension\ICalCalendar;

use ApiBase;
use ApiQueryBase;
use MediaWiki\MediaWikiServices;
use \DeferredUpdates;


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
			DeferredUpdates::addCallableUpdate(function() use ($store){$store->fetch();},DeferredUpdates::POSTSEND);
		}
		
		$this->getResult()->addValue( null, $this->getModuleName(), $store->getEvents());
	}

    public function getCacheMode( $params ) {
        return 'public';
    }
}
