const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { id, title, price, status } = req.body;

    if (!id) {
      context.res.status = 400;
      context.res.body = { error: "Missing required field: id" };
      return context.res;
    }

    const updates = [];
    const values = [id];
    let paramCount = 1;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }

    if (price !== undefined) {
      paramCount++;
      updates.push(`price = $${paramCount}`);
      values.push(price);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }

    if (updates.length === 0) {
      context.res.status = 400;
      context.res.body = { error: "No fields to update" };
      return context.res;
    }

    updates.push(`updated_at = NOW()`);

    await withLessorClient(req, async (client, lessorId) =>
      client.query(`
        UPDATE fri_dealer_listings 
        SET ${updates.join(', ')}
        WHERE id = $1
      `, values)
    );

    context.res.status = 200;
    context.res.body = { id, message: "Listing updated successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
