// api/approve-receipt.js
import { get, put } from '@vercel/blob';

const RECEIPTS_BLOB_KEY = 'all-receipts.json';

async function getReceiptsFromBlob() {
    try {
        const { data } = await get(RECEIPTS_BLOB_KEY, { type: 'json' });
        return data || [];
    } catch (error) {
        if (error.message.includes('not found')) {
            return [];
        }
        console.error("Error fetching receipts from Blob:", error);
        return [];
    }
}

async function saveReceiptsToBlob(receipts) {
    try {
        await put(RECEIPTS_BLOB_KEY, JSON.stringify(receipts), {
            access: 'public',
            contentType: 'application/json',
        });
        return true;
    } catch (error) {
        console.error("Error saving receipts to Blob:", error);
        return false;
    }
}

export default async function handler(req, res) {
    if (req.method === 'PUT') {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Missing receipt ID' });
        }

        const receipts = await getReceiptsFromBlob();
        const receiptIndex = receipts.findIndex(r => r.id === id);

        if (receiptIndex === -1) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        if (receipts[receiptIndex].status === 'approved') {
            return res.status(200).json({ message: 'Receipt already approved', receipt: receipts[receiptIndex] });
        }

        receipts[receiptIndex].status = 'approved';
        const success = await saveReceiptsToBlob(receipts);

        if (success) {
            return res.status(200).json({ message: 'Receipt approved successfully', receipt: receipts[receiptIndex] });
        } else {
            return res.status(500).json({ message: 'Failed to approve receipt' });
        }

    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}