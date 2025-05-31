// api/receipts.js
import { get, put } from '@vercel/blob';

// Blob key for storing receipts data. You can choose any name.
const RECEIPTS_BLOB_KEY = 'all-receipts.json';

async function getReceiptsFromBlob() {
    try {
        const { data } = await get(RECEIPTS_BLOB_KEY, { type: 'json' });
        return data || []; // Return empty array if blob doesn't exist or is empty
    } catch (error) {
        // If the blob doesn't exist yet, it's fine, just return empty array
        if (error.message.includes('not found')) {
            return [];
        }
        console.error("Error fetching receipts from Blob:", error);
        return []; // Return empty array on other errors
    }
}

async function saveReceiptsToBlob(receipts) {
    try {
        await put(RECEIPTS_BLOB_KEY, JSON.stringify(receipts), {
            access: 'public', // Or 'private' if you only want to access via signed URLs (more complex)
            contentType: 'application/json',
        });
        return true;
    } catch (error) {
        console.error("Error saving receipts to Blob:", error);
        return false;
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const receipts = await getReceiptsFromBlob();
        return res.status(200).json(receipts);
    } else if (req.method === 'POST') {
        const newReceipt = req.body;
        if (!newReceipt || !newReceipt.client_name || !newReceipt.phone || !newReceipt.filename) {
            return res.status(400).json({ message: 'Missing required receipt data' });
        }

        const receipts = await getReceiptsFromBlob();
        // Assign a simple ID (in a real app, use a more robust ID generation)
        newReceipt.id = receipts.length ? Math.max(...receipts.map(r => r.id)) + 1 : 1;
        newReceipt.status = 'pending'; // New receipts are always pending
        receipts.push(newReceipt);

        const success = await saveReceiptsToBlob(receipts);
        if (success) {
            return res.status(201).json({ message: 'Receipt submitted successfully', receipt: newReceipt });
        } else {
            return res.status(500).json({ message: 'Failed to save receipt' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}