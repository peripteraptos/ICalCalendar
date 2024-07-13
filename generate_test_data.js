const { faker } = require("@faker-js/faker");

// Function to generate a random date within 5 months around the current date
function getRandomDateAroundCurrent() {
  const currentDate = new Date();
  currentDate.setMinutes(faker.helpers.arrayElement([0, 15, 30, 45]));
  const randomDays = faker.number.int({ min: -150, max: 150 });
  currentDate.setDate(currentDate.getDate() + randomDays);
  return currentDate;
}

// Function to generate a single event
function generateEvent(id) {
  const startDate = getRandomDateAroundCurrent();
  const endDate = new Date(
    startDate.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000
  );

  return {
    id: String(id),
    type: faker.helpers.arrayElement([
      "Room schedule",
      "Curriculum",
      "Reminder",
      "Event"
    ]),
    title: faker.company.catchPhrase(),
    location: faker.location.city(),
    description: faker.lorem.sentences(5),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

// Generate a list of events
function generateEvents(count) {
  return Array.from({ length: count }, (_, i) => generateEvent(i + 1));
}

console.log(JSON.stringify({ calendar: generateEvents(500) }));
