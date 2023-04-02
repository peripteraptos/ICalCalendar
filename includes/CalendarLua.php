<?php
namespace MediaWiki\Extension\ICalCalendar;

/**
 * Class for exposing the parser functions for Cargo to Lua.
 * The functions are available via mw.ext.cargo Lua table.
 *
 * @author Yaron Koren.
 * @author Alexander Mashin.
 */
class CalendarLua extends \Scribunto_LuaLibraryBase {

	/**
	 * Register two Lua bindings: mw.ext.cargo.query and mw.ext.cargo.format
	 * @return array|null
	 */	
	public function register() {
		$lib = [
			'query' => [ $this, 'calendarQuery' ],
		];
		return $this->getEngine()->registerInterface( __DIR__ . '/../calendar.lua', $lib, [] );
	}

    public function calendarQuery(){

        return [
            ["name" => "test123", "id" => 123]
        ];
    }
}