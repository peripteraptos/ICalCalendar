<?php

namespace MediaWiki\Extension\ICalCalendar\Tests;

use MediaWiki\Extension\ICalCalendar\Calendar;
use MediaWiki\Extension\ICalCalendar\CalendarStore;
use PHPUnit\Framework\TestCase;

/**
 * A CalendarStore whose cache file lives in a per-test temp path (instead of
 * wfTempDir(), a MediaWiki global unavailable outside a running wiki) and
 * whose createCalendar() factory returns canned stub events instead of
 * making a real HTTP request.
 */
class TestableCalendarStore extends CalendarStore
{
    public string $cacheFilePath;
    public array $stubEventsBySource = [];
    public int $createCalendarCallCount = 0;

    public function __construct(string $cacheFilePath)
    {
        $this->cacheFilePath = $cacheFilePath;
    }

    public function getCacheFilePath()
    {
        return $this->cacheFilePath;
    }

    protected function createCalendar($url, $name): Calendar
    {
        $this->createCalendarCallCount++;
        $events = $this->stubEventsBySource[$name] ?? [];

        return new class ($events) extends Calendar {
            private array $stubEvents;

            public function __construct(array $stubEvents)
            {
                $this->stubEvents = $stubEvents;
            }

            public function getMappedEvents()
            {
                return $this->stubEvents;
            }
        };
    }
}

class CalendarStoreTest extends TestCase
{
    private string $cacheFile;

    protected function setUp(): void
    {
        $this->cacheFile = tempnam(sys_get_temp_dir(), 'icalcalendar-test-');
        unlink($this->cacheFile); // start each test with no cache file present
    }

    protected function tearDown(): void
    {
        if (file_exists($this->cacheFile)) {
            unlink($this->cacheFile);
        }
    }

    private function newStore(): TestableCalendarStore
    {
        return new TestableCalendarStore($this->cacheFile);
    }

    public function testCacheExistsFalseBeforeAndTrueAfterSave(): void
    {
        $store = $this->newStore();
        $this->assertFalse($store->cacheExists());

        $store->events = [['id' => '1']];
        $store->saveCache();

        $this->assertTrue($store->cacheExists());
    }

    public function testSaveCacheAndLoadCacheRoundTrip(): void
    {
        $store = $this->newStore();
        $store->events = [['id' => '1', 'title' => 'Event One']];
        $store->saveCache();

        $loaded = $store->loadCache();

        $this->assertSame($store->events, $loaded);
    }

    public function testCacheValidUntilIsFileMtimePlusCacheSeconds(): void
    {
        $store = $this->newStore();
        $store->events = [];
        $store->saveCache();

        $backdated = time() - 30;
        touch($this->cacheFile, $backdated);

        $this->assertSame($backdated + CalendarStore::CACHE_SECONDS, $store->cacheValidUntil());
    }

    public function testCacheOutdatedFalseImmediatelyAfterSave(): void
    {
        $store = $this->newStore();
        $store->events = [];
        $store->saveCache();

        $this->assertFalse($store->cacheOutdated());
    }

    public function testCacheOutdatedTrueOncePastCacheSeconds(): void
    {
        $store = $this->newStore();
        $store->events = [];
        $store->saveCache();

        touch($this->cacheFile, time() - CalendarStore::CACHE_SECONDS - 1);

        $this->assertTrue($store->cacheOutdated());
    }

    public function testGetCategoriesReadsColorPerSourceFromGlobal(): void
    {
        $GLOBALS['wgCalendarSources'] = [
            'Red Calendar' => ['url' => 'https://example.com/red.ics', 'color' => '#ff0000'],
            'Blue Calendar' => ['url' => 'https://example.com/blue.ics', 'color' => '#0000ff'],
        ];

        $store = $this->newStore();

        $this->assertSame([
            'Red Calendar' => '#ff0000',
            'Blue Calendar' => '#0000ff',
        ], $store->getCategories());

        unset($GLOBALS['wgCalendarSources']);
    }

    public function testFetchConcatenatesStubEventsFromAllSourcesAndWritesCache(): void
    {
        $GLOBALS['wgCalendarSources'] = [
            'Red Calendar' => ['url' => 'https://example.com/red.ics', 'color' => '#ff0000'],
            'Blue Calendar' => ['url' => 'https://example.com/blue.ics', 'color' => '#0000ff'],
        ];

        $store = $this->newStore();
        $store->stubEventsBySource = [
            'Red Calendar' => [['id' => 'r1', 'title' => 'Red Event']],
            'Blue Calendar' => [['id' => 'b1', 'title' => 'Blue Event']],
        ];

        $store->fetch();

        $this->assertSame([
            ['id' => 'r1', 'title' => 'Red Event'],
            ['id' => 'b1', 'title' => 'Blue Event'],
        ], $store->events);
        $this->assertTrue($store->cacheExists());

        unset($GLOBALS['wgCalendarSources']);
    }

    public function testGetEventsFetchesWhenNoCachePresent(): void
    {
        $GLOBALS['wgCalendarSources'] = [
            'Red Calendar' => ['url' => 'https://example.com/red.ics', 'color' => '#ff0000'],
        ];

        $store = $this->newStore();
        $store->stubEventsBySource = [
            'Red Calendar' => [['id' => 'r1', 'title' => 'Red Event']],
        ];

        $events = $store->getEvents();

        $this->assertSame([['id' => 'r1', 'title' => 'Red Event']], $events);
        $this->assertSame(1, $store->createCalendarCallCount);

        unset($GLOBALS['wgCalendarSources']);
    }

    public function testGetEventsUsesFreshCacheWithoutFetching(): void
    {
        $GLOBALS['wgCalendarSources'] = [
            'Red Calendar' => ['url' => 'https://example.com/red.ics', 'color' => '#ff0000'],
        ];

        // Prime the cache directly.
        $seed = $this->newStore();
        $seed->events = [['id' => 'cached', 'title' => 'Cached Event']];
        $seed->saveCache();

        $store = $this->newStore();
        $store->stubEventsBySource = [
            'Red Calendar' => [['id' => 'should-not-be-used']],
        ];

        $events = $store->getEvents();

        $this->assertSame([['id' => 'cached', 'title' => 'Cached Event']], $events);
        $this->assertSame(0, $store->createCalendarCallCount);

        unset($GLOBALS['wgCalendarSources']);
    }
}
