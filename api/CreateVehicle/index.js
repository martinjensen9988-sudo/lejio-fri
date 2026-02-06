const { withLessorClient } = require('../rls');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { make, model, year, license_plate, daily_rate } = req.body;

    if (!make || !model || !year || !license_plate || !daily_rate) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return context.res;
    }

    const vehicleId = uuidv4();

    await withLessorClient(req, async (client, lessorId) =>
      client.query(`
        INSERT INTO fri_vehicles 
        (id, lessor_id, make, model, year, license_plate, daily_rate, availability_status, is_active)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, 'available', TRUE)
      `, [vehicleId, lessorId, make, model, year, license_plate, daily_rate])
    );

    context.res.status = 201;
    context.res.body = { id: vehicleId, message: "Vehicle created successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
