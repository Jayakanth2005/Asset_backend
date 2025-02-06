const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Client Configuration
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    port: process.env.DB_PORT || 5432,
    password: process.env.DB_PASSWORD || 'jayakanth',
    database: process.env.DB_NAME || 'asset'
});

// Connect to PostgreSQL
const connectToDatabase = async () => {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL!');
    } catch (err) {
        console.error('Error connecting to PostgreSQL:', err.message);
        process.exit(1); // Exit the process if the connection fails
    }
};

connectToDatabase();

// API Endpoint to Fetch Counts from Multiple Tables
app.get('/api/assets/count', async (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM public."assetmanage") AS asset_count,
            (SELECT COUNT(*) FROM public."disposal") AS disposal_count,
            (SELECT COUNT(*) FROM public."maintenance_manage") AS maintenance_count,
            (SELECT COUNT(*) FROM public."assetmanage" WHERE status='Assigned') AS usage_count,
            (SELECT COUNT(*) FROM public."softwareassets") AS software_count,
            (SELECT COUNT(*) FROM public."assetmanage" WHERE status='Stock') AS stock_count,
            (SELECT COUNT(*) FROM public."softwareassets" WHERE expiredstatus='Yes') AS expiry_count
    `;

    try {
        const result = await client.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching counts:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to View Details of a Specified Asset
app.get('/api/assets/:id', async (req, res) => {
    const assetId = req.params.id;

    if (!assetId) {
        return res.status(400).json({ message: "Asset ID is required" });
    }

    const query = `SELECT * FROM public."assetmanage" WHERE assetid = $1`;

    try {
        const result = await client.query(query, [assetId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Asset not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching asset:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to Fetch All Assets in the Hardware Master Table
app.get('/api/assets', async (req, res) => {
    const query = `
        SELECT 
            a.assetid, 
            a.assettype, 
            a.make, 
            a.productid, 
            a.purchasedate, 
            a.retailer, 
            a.warrantyexpiry, 
            a.assigneduserid, 
            a.location, 
            a.status, 
            a.lastcheckoutdate,
            a.size,
            a.operatingsystem,
            a.typeofos,
            a.productkey,
            a.processor,
            a.ram,
            a.harddisktype,
            a.harddisksize,
            a.harddiskmodel,
            a.resolution,
            a.graphicscardmodel,
            a.externaldongledetails,
            a.check_in
        FROM public."assetmanage" a
        ORDER BY a.assetid;
    `;

    try {
        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No assets found" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to Fetch All Disposal Records
app.get('/api/disposal', async (req, res) => {
    const query = `SELECT * FROM public."disposal";`;

    try {
        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No disposal records found" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get('/api/employee', async (req, res) => {
    const query = `SELECT * FROM public."Userdetails";`;

    try {
        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No user records found" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to Fetch All In/Out Records
app.get('/api/inout', async (req, res) => {
    const query = `SELECT * FROM public."in_out" ORDER BY assetid;`;

    try {
        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No in/out records found" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to Fetch All Maintenance Records
app.get('/api/maintenance', async (req, res) => {
    const query = `SELECT * FROM public."maintenance_manage" ORDER BY assetid;`;

    try {
        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No maintenance records found" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to Fetch All Software Assets
app.get('/api/software', async (req, res) => {
    const query = `
        SELECT
            a.softwareid,
            a.softwarename,
            a.softwareversion,
            a.purchasedate,
            a.assetid,
            a.licensetype,
            a.licenseexpirydate,
            a.assigneduserid,
            a.project,
            a.userstatus,
            a.vendor,
            a.licensepurchasedate,
            a.licensekey,
            a.serialnumber,
            a.licenseduration,
            a.licensecost,
            a.username,
            a.password,
            a.expiredstatus,
            a.renewaldate,
            a.renewalcost,
            a.comments
        FROM public."softwareassets" a
        ORDER BY a.softwareid;
    `;

    try {
        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No software assets found" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to Fetch Software Asset by ID
app.get('/api/softwareassets/:id', async (req, res) => {
    const softwareId = req.params.id; // Change variable name to reflect softwareid

    if (!softwareId) {
        return res.status(400).json({ message: "Software ID is required" });
    }

    // Update the query to use softwareid instead of assetid
    const query = `SELECT * FROM public."softwareassets" WHERE softwareid = $1`;

    try {
        const result = await client.query(query, [softwareId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Software asset not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching software asset:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/api/software', async (req, res) => {
    const {
        softwareid,
        softwarename,
        softwareversion,
        purchasedate,
        assetid,
        licensetype,
        licenseexpirydate,
        assigneduserid,
        project,
        userstatus,
        vendor,
        licensepurchasedate,
        licensekey,
        serialnumber,
        licenseduration,
        licensecost,
        username,
        password,
        expiredstatus,
        renewaldate,
        renewalcost,
        comments
    } = req.body;

    // Validate required fields
    if (!softwareid) {
        return res.status(400).json({ message: "Software ID is required" });
    }

    // Check if the softwareid already exists
    const checkQuery = `SELECT 1 FROM public."softwareassets" WHERE softwareid = $1`;
    try {
        const checkResult = await client.query(checkQuery, [softwareid]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: "Software ID already exists" });
        }

        // Insert the new software asset
        const insertQuery = `
            INSERT INTO public."softwareassets" (
                softwareid, softwarename, softwareversion, purchasedate, assetid,
                licensetype, licenseexpirydate, assigneduserid, project, 
                userstatus, vendor, licensepurchasedate, licensekey, 
                serialnumber, licenseduration, licensecost, username, 
                password, expiredstatus, renewaldate, renewalcost, comments
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [
            softwareid, softwarename, softwareversion, purchasedate, assetid, 
            licensetype, licenseexpirydate, assigneduserid, project, 
            userstatus, vendor, licensepurchasedate, licensekey, 
            serialnumber, licenseduration, licensecost, username, 
            password, expiredstatus, renewaldate, renewalcost, comments
        ]);

        res.status(201).json({
            message: "Software asset added successfully!",
            software: result.rows[0]
        });
    } catch (err) {
        console.error('Error adding software asset:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

//delete of the software assets
app.delete('/api/software/:id', async (req, res) => {
    const softwareId = req.params.id; // Extract software ID from the URL

    if (!softwareId) {
        return res.status(400).json({ message: "Software ID is required" });
    }

    try {
        // Check if the software asset exists
        const checkQuery = `SELECT 1 FROM public."softwareassets" WHERE softwareid = $1`;
        const checkResult = await client.query(checkQuery, [softwareId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "Software asset not found" });
        }

        // Delete the software asset
        const deleteQuery = `DELETE FROM public."softwareassets" WHERE softwareid = $1 RETURNING *`;
        const deleteResult = await client.query(deleteQuery, [softwareId]);

        res.status(200).json({
            message: "Software asset deleted successfully!",
            software: deleteResult.rows[0], // Return the deleted record
        });
    } catch (err) {
        console.error('Error deleting software asset:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// API Endpoint to Add a New Asset
app.post('/api/assets', async (req, res) => {
    console.log("Received data:", req.body); 
    const {
        assetid,
        assettype,
        make,
        productid,
        purchasedate,
        retailer,
        warrantyexpiry,
        assigneduserid,
        location,
        status,
        lastcheckoutdate,
        size,
        operatingsystem,
        typeofos,
        productkey,
        processor,
        ram,
        harddisktype,
        harddisksize,
        harddiskmodel,
        resolution,
        graphicscardmodel,
        externaldongledetails,
        check_in
    } = req.body;

    if (!assetid) {
        return res.status(400).json({ message: "Asset ID is required" });
    }

    // Check if the assetid already exists
    const checkQuery = `SELECT 1 FROM public."assetmanage" WHERE assetid = $1`;
    try {
        const checkResult = await client.query(checkQuery, [assetid]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: "Asset ID already exists" });
        }

        const formattedPurchasedate = purchasedate === "" ? null : purchasedate;
        const formattedWarrantyexpiry = warrantyexpiry === "" ? null : warrantyexpiry;
        const formattedLastcheckoutdate = lastcheckoutdate === "" ? null : lastcheckoutdate;
        const formattedAssigneduserid = assigneduserid === "" ? null : assigneduserid;
        const finalStatus = formattedAssigneduserid ? status : "inStock";
        const formattedCheckin = check_in === "" ? null : check_in;

        // Insert the new asset
        const insertQuery = `
            INSERT INTO public."assetmanage" (
                assetid, assettype, make, productid, purchasedate, 
                retailer, warrantyexpiry, assigneduserid, location, 
                status, lastcheckoutdate, size, operatingsystem, 
                typeofos, productkey, processor, ram, harddisktype, 
                harddisksize, harddiskmodel, resolution, 
                graphicscardmodel, externaldongledetails,check_in
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [
            assetid, assettype, make, productid, formattedPurchasedate, 
            retailer, formattedWarrantyexpiry, formattedAssigneduserid, location, 
            finalStatus, formattedLastcheckoutdate, size, operatingsystem, 
            typeofos, productkey, processor, ram, harddisktype, 
            harddisksize, harddiskmodel, resolution, 
            graphicscardmodel, externaldongledetails,formattedCheckin
        ]);

        res.status(201).json({
            message: "Asset added successfully!",
            asset: result.rows[0]
        });
    } catch (err) {
        console.error('Error adding asset:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.delete("/api/assets/:id", async (req, res) => {
    const assetId = req.params.id;

    if (!assetId) {
        return res.status(400).json({ message: "Asset ID is required" });
    }

    try {
        console.log(`Attempting to delete asset with ID: ${assetId}`);

        // Check if the asset exists
        const checkQuery = `SELECT * FROM public."assetmanage" WHERE assetid = $1`;
        const checkResult = await client.query(checkQuery, [assetId]);

        if (checkResult.rowCount === 0) {
            console.log("Asset not found in assetmanage table");
            return res.status(404).json({ message: "Asset not found" });
        }

        // Delete from maintenance_manage
        console.log("Deleting from maintenance_manage...");
        await client.query('DELETE FROM public."maintenance_manage" WHERE assetid = $1', [assetId]);

        // Delete from in_out
        console.log("Deleting from in_out...");
        await client.query('DELETE FROM public."in_out" WHERE assetid = $1', [assetId]);

        // Delete from assetmanage
        console.log("Updating asset status to 'disposed'...");
        const updateQuery = `UPDATE public."assetmanage" SET status = 'disposed' WHERE assetid = $1 RETURNING *`;
        const updateResult = await client.query(updateQuery, [assetId]);

        if (updateResult.rowCount === 0) {
            console.log("Failed to update asset status");
            return res.status(500).json({ message: "Failed to update asset status" });
        }

        console.log("Asset status updated to 'disposed' successfully");
        res.status(200).json({ message: "Asset status updated to 'disposed' successfully" });
    }
     catch (error) {
        console.error("Error updating asset:", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


app.put('/api/assets/:id', async (req, res) => {
    const assetId = req.params.id;
    const updatedAsset = req.body;

    if (!assetId) {
        return res.status(400).json({ message: "Asset ID is required" });
    }

    try {
        // Get the current asset data
        const existingAssetQuery = `SELECT * FROM public."assetmanage" WHERE assetid = $1`;
        const existingAssetResult = await client.query(existingAssetQuery, [assetId]);

        if (existingAssetResult.rows.length === 0) {
            return res.status(404).json({ message: "Asset not found" });
        }

        const existingAsset = existingAssetResult.rows[0];

        // Merge existing data with updated data
        const newAssetData = { ...existingAsset, ...updatedAsset };

        const oldAssignedUserId = existingAsset.assigneduserid;
        const formattedAssigneduserid = newAssetData.assigneduserid || null;

        // Determine final status
        let finalStatus = newAssetData.status;
        if (oldAssignedUserId && !formattedAssigneduserid) {
            finalStatus = "Unassigned";
        }

        const updateQuery = `
            UPDATE public."assetmanage"
            SET 
                assettype = $1,
                make = $2,
                productid = $3,
                purchasedate = $4,
                retailer = $5,
                warrantyexpiry = $6,
                assigneduserid = $7,
                location = $8,
                status = $9,
                lastcheckoutdate = $10,
                size = $11,
                operatingsystem = $12,
                typeofos = $13,
                productkey = $14,
                processor = $15,
                ram = $16,
                harddisktype = $17,
                harddisksize = $18,
                harddiskmodel = $19,
                resolution = $20,
                graphicscardmodel = $21,
                externaldongledetails = $22,
                check_in = $23
            WHERE assetid = $24
            RETURNING *;
        `;

        const result = await client.query(updateQuery, [
            newAssetData.assettype,
            newAssetData.make,
            newAssetData.productid,
            newAssetData.purchasedate,
            newAssetData.retailer,
            newAssetData.warrantyexpiry,
            formattedAssigneduserid,
            newAssetData.location,
            finalStatus,
            newAssetData.lastcheckoutdate,
            newAssetData.size,
            newAssetData.operatingsystem,
            newAssetData.typeofos,
            newAssetData.productkey,
            newAssetData.processor,
            newAssetData.ram,
            newAssetData.harddisktype,
            newAssetData.harddisksize,
            newAssetData.harddiskmodel,
            newAssetData.resolution,
            newAssetData.graphicscardmodel,
            newAssetData.externaldongledetails,
            newAssetData.check_in,
            assetId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Update failed" });
        }

        res.json({
            message: "Asset updated successfully!",
            asset: result.rows[0] 
        });
    } catch (err) {
        console.error("Error updating asset:", err);
        res.status(500).json({ error: "Server Error" });
    }
});


app.post("/api/disposal", async (req, res) => {
    const { assetid, repaired_on, disposaldate, reason } = req.body;
  
    if (!assetid || !repaired_on || !disposaldate || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    try {
      // Insert into the disposal table
      const query = `
        INSERT INTO public."disposal" (assetid, repaired_on, disposaldate, reason)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const result = await client.query(query, [assetid, repaired_on, disposaldate, reason]);
  
      if (result.rowCount === 0) {
        return res.status(500).json({ message: "Failed to insert disposal record" });
      }
  
      console.log("Disposal record inserted successfully");
      res.status(200).json({ message: "Disposal record added successfully" });
    } catch (error) {
      console.error("Error inserting disposal record:", error.message);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  });
  
// Start the Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});