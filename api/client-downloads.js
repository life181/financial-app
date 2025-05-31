// api/client-downloads.js
import { get, put } from '@vercel/blob';

const DOWNLOAD_COUNTS_BLOB_KEY = 'download-counts.json';

async function getDownloadCountsFromBlob() {
    try {
        const { data } = await get(DOWNLOAD_COUNTS_BLOB_KEY, { type: 'json' });
        return data || {}; // Return empty object if blob doesn't exist
    } catch (error) {
        if (error.message.includes('not found')) {
            return {};
        }
        console.error("Error fetching download counts from Blob:", error);
        return {};
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { clientName } = req.query; // Get clientName from query parameters
        if (!clientName) {
            return res.status(400).json({ message: 'Client name is required' });
        }

        const counts = await getDownloadCountsFromBlob();
        const clientData = counts[clientName] || { downloads: 0, lastDownloadDate: null };
        return res.status(200).json(clientData);
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}