<?php

namespace MediaWiki\Extension\ICalCalendar\Tests;

use ICal\ICal;
use MediaWiki\Extension\ICalCalendar\Calendar;
use PHPUnit\Framework\TestCase;

class CalendarTest extends TestCase
{
    private function loadFixture(): Calendar
    {
        $ical = new ICal(false, [
            'defaultSpan' => 2,
            'defaultTimeZone' => 'UTC',
            'defaultWeekStart' => 'MO',
            'disableCharacterReplacement' => false,
            'filterDaysAfter' => null,
            'filterDaysBefore' => null,
            'skipRecurrence' => false,
        ]);
        $ical->initString(file_get_contents(__DIR__ . '/fixtures/basic.ics'));

        return new Calendar('https://example.com/basic.ics', 'Test Calendar', $ical);
    }

    public function testConstructorDoesNotFetchOverNetworkWhenIcalProvided(): void
    {
        // If this constructs without a network call/timeout, the DI seam works.
        $calendar = $this->loadFixture();
        $this->assertSame('Test Calendar', $calendar->name);
        $this->assertSame('https://example.com/basic.ics', $calendar->url);
    }

    public function testGetEventsReturnsEventsInChronologicalOrder(): void
    {
        $calendar = $this->loadFixture();
        $events = $calendar->getEvents();

        $this->assertCount(3, $events);
        $starts = array_map(
            fn($e) => $calendar->ical->iCalDateToDateTime($e->dtstart_array[3])->format(\DateTime::ATOM),
            $events
        );
        $sorted = $starts;
        sort($sorted);
        $this->assertSame($sorted, $starts);
    }

    public function testGetMappedEventsMapsToExpectedShape(): void
    {
        $calendar = $this->loadFixture();
        $mapped = $calendar->getMappedEvents();

        $this->assertCount(3, $mapped);

        $plain = array_values(array_filter($mapped, fn($e) => $e['title'] === 'Plain Meeting'))[0];

        $this->assertSame('plain-event-1@example.com', $plain['id']);
        $this->assertSame('Test Calendar', $plain['type']);
        $this->assertSame('Plain Meeting', $plain['title']);
        $this->assertSame('2026-02-10T14:00:00+00:00', $plain['startDate']);
        $this->assertSame('2026-02-10T15:00:00+00:00', $plain['endDate']);
        $this->assertSame('A plain, non-recurring meeting.', $plain['description']);
        $this->assertSame('Room 101', $plain['location']);
        $this->assertFalse($plain['isRecurring']);
    }

    public function testIsRecurringFlagReflectsRrulePresence(): void
    {
        $calendar = $this->loadFixture();
        $mapped = $calendar->getMappedEvents();

        $recurringEntries = array_values(array_filter($mapped, fn($e) => $e['title'] === 'Weekly Standup'));
        $plainEntries = array_values(array_filter($mapped, fn($e) => $e['title'] === 'Plain Meeting'));

        $this->assertCount(2, $recurringEntries);
        $this->assertCount(1, $plainEntries);

        foreach ($recurringEntries as $entry) {
            $this->assertTrue($entry['isRecurring']);
        }
        $this->assertFalse($plainEntries[0]['isRecurring']);
    }

    public function testToJsonProducesJsonMatchingGetMappedEvents(): void
    {
        $calendar = $this->loadFixture();

        $decoded = json_decode($calendar->toJson(), true);

        $this->assertSame($calendar->getMappedEvents(), $decoded);
    }
}
