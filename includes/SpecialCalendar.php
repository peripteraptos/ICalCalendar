<?php
/**
 * VueTest Special page.
 *
 * @file
 */

namespace MediaWiki\Extension\ICalCalendar;

class SpecialCalendar extends \SpecialPage
{

	/**
	 * Initialize the special page.
	 */
	public function __construct()
	{
		// A special page should at least have a name.
		// We do this by calling the parent class (the SpecialPage class)
		// constructor method with the name as first and only parameter.
		parent::__construct('ICalCalendar');
	}

	/**
	 * Shows the page to the user.
	 * @param string $sub The subpage string argument (if any).
	 *  [[Special:HelloWorld/subpage]].
	 */
	public function execute($sub)
	{
		$out = $this->getOutput();
		$markup = '<div id="ical-calendar-root"></div>';
		$out->setPageTitle("ICalCalendar");
		$out->addHTML($markup);
		$out->addModules('ext.ICalCalendar');
	}

	protected function getGroupName()
	{
		return 'other';
	}
}

