<?php
namespace MediaWiki\Extension\ICalCalendar;

use Parser;
use FormatJson;

class Hooks implements
	\MediaWiki\Hook\ParserFirstCallInitHook,
	\MediaWiki\Hook\BeforePageDisplayHook
 {

	public function onBeforePageDisplay( $out, $skin ): void {
		$out->addModules( ['ext.ICalCalendar'] );
	}


	/**
	 * Register parser hooks.
	 *
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 * @see https://www.mediawiki.org/wiki/Manual:Parser_functions
	 * @param Parser $parser
	 * @throws \MWException
	 */
	public function onParserFirstCallInit( $parser ) {
		// Add the following to a wiki page to see how it works:
		// <dump>test</dump>
		// <dump foo="bar" baz="quux">test content</dump>
		//$parser->setHook( 'dump', [ self::class, 'parserTagDump' ] );

		// Add the following to a wiki page to see how it works:
		// {{#echo: hello }}
		//$parser->setFunctionHook( 'echo', [ self::class, 'parserFunctionEcho' ] );

		// Add the following to a wiki page to see how it works:
		// {{#showme: hello | hi | there }}
		$parser->setFunctionHook( 'calendar', [ self::class, 'parserFunctionShowCalendar' ] );
	}


	/**
	 * Parser function handler for {{#showme: .. | .. }}
	 *
	 * @param Parser $parser
	 * @param string $value
	 * @param string ...$args
	 * @return string HTML to insert in the page.
	 */
	public static function parserFunctionShowCalendar( Parser $parser, string $value, ...$args ) {

		$events = [];
		foreach(self::getCalendars() as $name => $calendar){
			$cal = new Calendar($calendar["url"],$name);
			$events = [...$events, $cal->getMappedEvents()];
		}
		
		$showme = [
			'value' => $value,
			'arguments' => $args,
		];

		return '<pre>Showme Function: '
			. json_encode($events)
			. '</pre>';
	}


	/**
	 * Parser magic word handler for {{MYWORD}}.
	 *
	 * @return string Wikitext to be rendered in the page.
	 */
	public static function getCalendars() {
		global $wgCalendarSources;
		return $wgCalendarSources;
	}

}
