<?php

namespace MediaWiki\Extension\ICalCalendar;

class VueCalendarModule extends \ResourceLoaderFileModule {
	/** @inheritDoc */
/*	public function getScript( \ResourceLoaderContext $context ) {
		$conf = $this->getConfig();
		return \Xml::encodeJsCall( 'mw.config.set', [ [
//			'wgExampleWelcomeColorDays' => $conf->get( 'ExampleWelcomeColorDays' ),
//			'wgExampleWelcomeColorDefault' => $conf->get( 'ExampleWelcomeColorDefault' ),
			] ] )
			. parent::getScript( $context );
	}*/

	/** @return bool */
	public function enableModuleContentVersion() {
		return true;
	}

	/** @return bool */
	public function supportsURLLoading() {
		return false;
	}
}

