const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://suprima-platform-pb.fly.dev');

async function main() {
  try {
    console.log("Fetching one student record...");
    const students = await pb.collection('suprima_students').getList(1, 1);
    if (students.items.length > 0) {
      console.log("Student fields:", Object.keys(students.items[0]));
      console.log("Sample student:", JSON.stringify(students.items[0], null, 2));
    } else {
      console.log("No student records found.");
    }

    console.log("\nFetching one profile record...");
    const profiles = await pb.collection('suprima_profiles').getList(1, 1);
    if (profiles.items.length > 0) {
      console.log("Profile fields:", Object.keys(profiles.items[0]));
      console.log("Sample profile:", JSON.stringify(profiles.items[0], null, 2));
    } else {
      console.log("No profile records found.");
    }
  } catch (err) {
    console.error("Error fetching schema:", err);
  }
}

main();
