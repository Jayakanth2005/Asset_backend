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
            u.name AS assigneduser,  -- Fetching username instead of user ID
            a.location, 
            a.status, 
            a.lastcheckoutdate 
        FROM public."assetmanage" a
        LEFT JOIN public."Userdetails" u ON a.assigneduserid = u.userid
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
            a.userstatus
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
    const assetId = req.params.id;

    if (!assetId) {
        return res.status(400).json({ message: "Asset ID is required" });
    }

    const query = `SELECT * FROM public."softwareassets" WHERE assetid = $1`;

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

// API Endpoint to Add a New Asset
app.post('/api/assets', async (req, res) => {
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
        externaldongledetails
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

        // Insert the new asset
        const insertQuery = `
            INSERT INTO public."assetmanage" (
                assetid, assettype, make, productid, purchasedate, 
                retailer, warrantyexpiry, assigneduserid, location, 
                status, lastcheckoutdate, size, operatingsystem, 
                typeofos, productkey, processor, ram, harddisktype, 
                harddisksize, harddiskmodel, resolution, 
                graphicscardmodel, externaldongledetails
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [
            assetid, assettype, make, productid, purchasedate, 
            retailer, warrantyexpiry, assigneduserid, location, 
            status, lastcheckoutdate, size, operatingsystem, 
            typeofos, productkey, processor, ram, harddisktype, 
            harddisksize, harddiskmodel, resolution, 
            graphicscardmodel, externaldongledetails
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

// Start the Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});