// api/increment-download.js
import { get, put } from '@vercel/blob';

const DOWNLOAD_COUNTS_BLOB_KEY = 'download-counts.json';

async function getDownloadCountsFromBlob() {
    try {
        const { data } = await get(DOWNLOAD_COUNTS_BLOB_KEY, { type: 'json' });
        return data || {};
    } catch (error) {
        if (error.message.includes('not found')) {
            return {};
        }
        console.error("Error fetching download counts from Blob:", error);
        return {};
    }
}

async function saveDownloadCountsToBlob(counts) {
    try {
        await put(DOWNLOAD_COUNTS_BLOB_KEY, JSON.stringify(counts), {
            access: 'public',
            contentType: 'application/json',
        });
        return true;
    } catch (error) {
        console.error("Error saving download counts to Blob:", error);
        return false;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { clientName } = req.body;
        if (!clientName) {
            return res.status(400).json({ message: 'Client name is required' });
        }

        const counts = await getDownloadCountsFromBlob();
        counts[clientName] = counts[clientName] || { downloads: 0, lastDownloadDate: null };
        counts[clientName].downloads++;
        counts[clientName].lastDownloadDate = new Date().toISOString().slice(0, 10);

        const success = await saveDownloadCountsToBlob(counts);
        if (success) {
            return res.status(200).json({ message: 'Download count incremented', clientData: counts[clientName] });
        } else {
            return res.status(500).json({ message: 'Failed to increment download count' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}