<?php
/**
 * A job that reparses a wiki page, if time is come.
 *
 * @author Alexander Mashin
 *
 */
class ReloadJob extends \Job {
	/**
	 * @see Job::run
	 *
	 * @return bool True on success, false if something is very wrong.
	 */
	public function run() {
		$store = new CalendarStore();
		$store->fetch();
	}
}
