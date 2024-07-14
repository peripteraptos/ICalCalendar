<?php

namespace MediaWiki\Extension\ICalCalendar;

use ApiQueryBase;
use MediaWiki\Deferred\DeferredUpdates;

class Api extends ApiQueryBase
{

	/**
	 * @param \ApiQuery $query
	 * @param string $moduleName
	 */
	public function __construct($query, $moduleName)
	{
		parent::__construct($query, $moduleName, 'calendar');
	}

	/**
	 * In this example we're returning one ore more properties
	 * of wgExampleFooStuff. In a more realistic example, this
	 * method would probably
	 */
	public function execute()
	{
		$store = new CalendarStore();
		if ($store->cacheOutdated()) {
			DeferredUpdates::addCallableUpdate(function () use ($store) {
				$store->fetch();
			});
		}

		$this->getResult()->addValue(null, $this->getModuleName(), $store->getEvents());
		$this->getResult()->addValue(null, 'expiresIn', time() - $store->cacheValidUntil());
		$this->getResult()->addValue(null, 'categories', $store->getCategories());

	}

	public function getCacheMode($params)
	{
		return 'public';
	}
}
