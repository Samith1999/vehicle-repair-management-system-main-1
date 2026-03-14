const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Example: Add a vehicle
async function addVehicle(vehicle) {
  const res = await db.collection('vehicles').add(vehicle);
  return res.id;
}

// Example: Get all vehicles
async function getVehicles() {
  const snapshot = await db.collection('vehicles').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Example: Update a vehicle
async function updateVehicle(id, data) {
  await db.collection('vehicles').doc(id).update(data);
}

// Example: Delete a vehicle
async function deleteVehicle(id) {
  await db.collection('vehicles').doc(id).delete();
}

module.exports = {
  addVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle
};