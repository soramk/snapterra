/* ==========================================================================
   Terraform Boilerplate Generator — Download Functionality
   ========================================================================== */

function downloadSingleFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    // For files with paths like ".github/workflows/terraform.yml", use the basename
    const baseName = fileName.split('/').pop();
    a.href = url;
    a.download = baseName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Minimal ZIP implementation (no external dependencies)
// Creates a valid ZIP file using the store method (no compression needed for small text files)
function createZipBlob(files) {
    const entries = [];
    let offset = 0;

    // Encode each file
    for (const file of files) {
        const nameBytes = new TextEncoder().encode(file.name);
        const contentBytes = new TextEncoder().encode(file.content);

        // Local file header (30 bytes + name length)
        const localHeader = new ArrayBuffer(30 + nameBytes.length);
        const lhView = new DataView(localHeader);
        lhView.setUint32(0, 0x04034b50, true);  // Local file header signature
        lhView.setUint16(4, 20, true);           // Version needed to extract
        lhView.setUint16(6, 0x0800, true);       // General purpose bit flag (UTF-8)
        lhView.setUint16(8, 0, true);            // Compression method (stored)
        lhView.setUint16(10, 0, true);           // Last mod file time
        lhView.setUint16(12, 0, true);           // Last mod file date
        lhView.setUint32(14, crc32(contentBytes), true); // CRC-32
        lhView.setUint32(18, contentBytes.length, true);  // Compressed size
        lhView.setUint32(22, contentBytes.length, true);  // Uncompressed size
        lhView.setUint16(26, nameBytes.length, true);     // File name length
        lhView.setUint16(28, 0, true);           // Extra field length
        new Uint8Array(localHeader).set(nameBytes, 30);

        entries.push({
            nameBytes,
            contentBytes,
            localHeaderOffset: offset,
            crc: crc32(contentBytes),
        });

        offset += localHeader.byteLength + contentBytes.length;
    }

    // Build central directory
    const centralDirectory = [];
    for (const entry of entries) {
        const cdh = new ArrayBuffer(46 + entry.nameBytes.length);
        const cdView = new DataView(cdh);
        cdView.setUint32(0, 0x02014b50, true);   // Central directory file header signature
        cdView.setUint16(4, 20, true);            // Version made by
        cdView.setUint16(6, 20, true);            // Version needed to extract
        cdView.setUint16(8, 0x0800, true);        // General purpose bit flag (UTF-8)
        cdView.setUint16(10, 0, true);            // Compression method
        cdView.setUint16(12, 0, true);            // Last mod file time
        cdView.setUint16(14, 0, true);            // Last mod file date
        cdView.setUint32(16, entry.crc, true);    // CRC-32
        cdView.setUint32(20, entry.contentBytes.length, true); // Compressed size
        cdView.setUint32(24, entry.contentBytes.length, true); // Uncompressed size
        cdView.setUint16(28, entry.nameBytes.length, true);    // File name length
        cdView.setUint16(30, 0, true);            // Extra field length
        cdView.setUint16(32, 0, true);            // File comment length
        cdView.setUint16(34, 0, true);            // Disk number start
        cdView.setUint16(36, 0, true);            // Internal file attributes
        cdView.setUint32(38, 0, true);            // External file attributes
        cdView.setUint32(42, entry.localHeaderOffset, true); // Relative offset
        new Uint8Array(cdh).set(entry.nameBytes, 46);
        centralDirectory.push(cdh);
    }

    const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.byteLength, 0);

    // End of central directory record
    const eocd = new ArrayBuffer(22);
    const eocdView = new DataView(eocd);
    eocdView.setUint32(0, 0x06054b50, true);   // EOCD signature
    eocdView.setUint16(4, 0, true);             // Number of this disk
    eocdView.setUint16(6, 0, true);             // Central directory disk
    eocdView.setUint16(8, entries.length, true); // Total entries on this disk
    eocdView.setUint16(10, entries.length, true);// Total entries
    eocdView.setUint32(12, cdSize, true);        // Central directory size
    eocdView.setUint32(16, offset, true);        // Central directory offset
    eocdView.setUint16(20, 0, true);             // Comment length

    // Combine all parts
    const parts = [];
    for (let i = 0; i < entries.length; i++) {
        // Local header
        const nameBytes = entries[i].nameBytes;
        const contentBytes = entries[i].contentBytes;
        const localHeader = new ArrayBuffer(30 + nameBytes.length);
        const lhView = new DataView(localHeader);
        lhView.setUint32(0, 0x04034b50, true);
        lhView.setUint16(4, 20, true);
        lhView.setUint16(6, 0x0800, true);
        lhView.setUint16(8, 0, true);
        lhView.setUint16(10, 0, true);
        lhView.setUint16(12, 0, true);
        lhView.setUint32(14, entries[i].crc, true);
        lhView.setUint32(18, contentBytes.length, true);
        lhView.setUint32(22, contentBytes.length, true);
        lhView.setUint16(26, nameBytes.length, true);
        lhView.setUint16(28, 0, true);
        new Uint8Array(localHeader).set(nameBytes, 30);
        parts.push(new Uint8Array(localHeader));
        parts.push(contentBytes);
    }
    for (const cd of centralDirectory) {
        parts.push(new Uint8Array(cd));
    }
    parts.push(new Uint8Array(eocd));

    return new Blob(parts, { type: 'application/zip' });
}

// CRC-32 calculation
function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}
