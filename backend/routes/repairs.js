const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all repair requests
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, v.registration_number, v.vehicle_type, v.hospital_name
       FROM repair_requests r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching repair requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch repair requests' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, v.registration_number, v.vehicle_type, v.hospital_name
       FROM repair_requests r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found' });
    }
    const [history] = await db.execute(
      `SELECT s.*, o.name AS officer_name, o.role AS officer_role
       FROM status_updates s
       LEFT JOIN officers o ON s.officer_id = o.id
       WHERE s.repair_request_id = ?
       ORDER BY s.updated_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], history } });
  } catch (error) {
    console.error('Error fetching repair request:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch repair request' });
  }
});

router.post('/', async (req, res) => {
  const {
    vehicle_id,
    engineer_id,
    repair_details,
    engineer_signature,
    registration_number,
    vehicle_type,
    hospital_name,
    inspection_date,
    status
  } = req.body;

  try {
    if (!engineer_id || !repair_details) {
      return res.status(400).json({ success: false, error: 'Engineer ID and repair details are required' });
    }

    let finalVehicleId = vehicle_id;
    if (!finalVehicleId) {
      if (!registration_number || !vehicle_type) {
        return res.status(400).json({ success: false, error: 'Vehicle registration and type required' });
      }
      const [existingVehicle] = await db.execute('SELECT id FROM vehicles WHERE registration_number = ?', [registration_number]);
      if (existingVehicle.length > 0) {
        finalVehicleId = existingVehicle[0].id;
      } else {
        const [vehicleResult] = await db.execute(
          'INSERT INTO vehicles (registration_number, vehicle_type, hospital_name, current_status) VALUES (?, ?, ?, ?)',
          [registration_number, vehicle_type, hospital_name || null, 'under_repair']
        );
        finalVehicleId = vehicleResult.insertId;
      }
    }

    const inspectionDateStr = inspection_date || new Date().toISOString().split('T')[0];
    const repairStatus = status || 'inspection_completed';

    const [result] = await db.execute(
      'INSERT INTO repair_requests (vehicle_id, engineer_id, repair_details, engineer_signature, inspection_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [finalVehicleId, engineer_id, repair_details, engineer_signature || null, inspectionDateStr, repairStatus]
    );

    await db.execute('UPDATE vehicles SET current_status = ? WHERE id = ?', ['under_repair', finalVehicleId]);
    await db.execute('INSERT INTO status_updates (repair_request_id, officer_id, status, comments) VALUES (?, ?, ?, ?)',
      [result.insertId, engineer_id, repairStatus, 'Inspection request created']
    );

    res.status(201).json({ success: true, message: 'Repair request created successfully', repairId: result.insertId });
  } catch (error) {
    console.error('Error creating repair request:', error);
    res.status(500).json({ success: false, error: 'Failed to create repair request: ' + error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const { status, officer_id, comments } = req.body;
  const repairId = req.params.id;
  if (!status || !officer_id) {
    return res.status(400).json({ success: false, error: 'Status and officer ID are required' });
  }

  try {
    const [updateResult] = await db.execute('UPDATE repair_requests SET status = ? WHERE id = ?', [status, repairId]);
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found' });
    }

    await db.execute('INSERT INTO status_updates (repair_request_id, officer_id, status, comments) VALUES (?, ?, ?, ?)',
      [repairId, officer_id, status, comments || '']
    );
    if (status === 'approved') {
      const [repairRows] = await db.execute('SELECT vehicle_id FROM repair_requests WHERE id = ?', [repairId]);
      if (repairRows.length > 0) {
        await db.execute('UPDATE vehicles SET current_status = ? WHERE id = ?', ['repaired', repairRows[0].vehicle_id]);
      }
    }

    res.json({ success: true, message: `Repair request ${status} successfully` });
  } catch (error) {
    console.error('Error updating repair status:', error);
    res.status(500).json({ success: false, error: 'Failed to update repair status: ' + error.message });
  }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const [statusCount] = await db.execute('SELECT status, COUNT(*) as count FROM repair_requests GROUP BY status');
    const [monthlyStats] = await db.execute(
      "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count, SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count FROM repair_requests GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC LIMIT 6"
    );
    res.json({ success: true, data: { statusCount, monthlyStats } });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM repair_requests WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found' });
    }
    res.json({ success: true, message: 'Repair request deleted successfully' });
  } catch (error) {
    console.error('Error deleting repair request:', error);
    res.status(500).json({ success: false, error: 'Failed to delete repair request' });
  }
});

// Get all repairs for a specific engineer
router.get('/engineer/:engineerId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, v.registration_number, v.vehicle_type, v.hospital_name
       FROM repair_requests r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.engineer_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.engineerId]
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching engineer repairs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch engineer repairs' });
  }
});

module.exports = router;
