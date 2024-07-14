const { faker } = require("@faker-js/faker");
const fs = require("node:fs");
const path = require("node:path");
const categories = {
  "Room schedule": "#ffa500",
  "Key dates": "#0000ff",
  Curriculum: "#008000",
  Lectures: "#ffff00",
  Rundgang: "#ff00ff"
};

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
    type: faker.helpers.arrayElement(Object.keys(categories)),
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

try {
  fs.writeFileSync(
    path.resolve(__dirname, "calendar.json"),
    JSON.stringify({ calendar: generateEvents(500), categories })
  );
  // file written successfully
  console.log("Generated dates written to calendar.json written!");
} catch (err) {
  console.error(err);
}
