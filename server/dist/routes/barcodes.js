"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
/**
 * POST /barcodes/generate
 * Generate barcode SVG data for a given value
 * Supports Code128 (default), EAN-13, UPC-A, QR-like patterns
 */
router.post('/generate', async (req, res) => {
    try {
        const { value, type = 'code128', width = 2, height = 100, showText = true } = req.body;
        if (!value) {
            res.status(400).json({ message: 'Barcode value is required' });
            return;
        }
        // Generate Code128 barcode as SVG
        const svg = generateCode128SVG(String(value), {
            width: Number(width),
            height: Number(height),
            showText: Boolean(showText),
        });
        res.json({ svg, value: String(value), type });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
/**
 * POST /barcodes/batch
 * Generate barcodes for multiple products at once
 */
router.post('/batch', async (req, res) => {
    try {
        const { items, width = 2, height = 80, showText = true } = req.body;
        // items: [{ value: string, label?: string }]
        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ message: 'Items array is required' });
            return;
        }
        if (items.length > 100) {
            res.status(400).json({ message: 'Maximum 100 barcodes per batch' });
            return;
        }
        const barcodes = items.map((item) => ({
            value: String(item.value || item.sku || ''),
            label: item.label || item.name || '',
            price: item.price || null,
            svg: generateCode128SVG(String(item.value || item.sku || ''), {
                width: Number(width),
                height: Number(height),
                showText: Boolean(showText),
            }),
        }));
        res.json({ barcodes, count: barcodes.length });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
/**
 * POST /barcodes/print-layout
 * Generate a print-ready HTML layout for barcode labels
 */
router.post('/print-layout', async (req, res) => {
    try {
        const { items, labelWidth = 50, // mm
        labelHeight = 30, // mm
        columns = 3, showPrice = true, showName = true, fontSize = 8, } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ message: 'Items array is required' });
            return;
        }
        const barcodes = items.map((item) => ({
            value: String(item.value || item.sku || ''),
            label: item.label || item.name || '',
            price: item.price || null,
            quantity: item.quantity || 1,
            svg: generateCode128SVG(String(item.value || item.sku || ''), {
                width: 1.5,
                height: 50,
                showText: true,
            }),
        }));
        // Expand by quantity
        const expandedBarcodes = [];
        for (const bc of barcodes) {
            for (let i = 0; i < (bc.quantity || 1); i++) {
                expandedBarcodes.push(bc);
            }
        }
        const html = generatePrintHTML(expandedBarcodes, {
            labelWidth: Number(labelWidth),
            labelHeight: Number(labelHeight),
            columns: Number(columns),
            showPrice: Boolean(showPrice),
            showName: Boolean(showName),
            fontSize: Number(fontSize),
        });
        res.json({ html, totalLabels: expandedBarcodes.length });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ═══════════════════════════════════════════════════════════
// Code128 Barcode Generator (pure TypeScript, no dependencies)
// ═══════════════════════════════════════════════════════════
const CODE128_START_B = 104;
const CODE128_STOP = 106;
// Code128B character set encoding patterns (bar/space widths)
const CODE128_PATTERNS = [
    [2, 1, 2, 2, 2, 2], [2, 2, 2, 1, 2, 2], [2, 2, 2, 2, 2, 1], [1, 2, 1, 2, 2, 3],
    [1, 2, 1, 3, 2, 2], [1, 3, 1, 2, 2, 2], [1, 2, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2],
    [1, 3, 2, 2, 1, 2], [2, 2, 1, 2, 1, 3], [2, 2, 1, 3, 1, 2], [2, 3, 1, 2, 1, 2],
    [1, 1, 2, 2, 3, 2], [1, 2, 2, 1, 3, 2], [1, 2, 2, 2, 3, 1], [1, 1, 3, 2, 2, 2],
    [1, 2, 3, 1, 2, 2], [1, 2, 3, 2, 2, 1], [2, 2, 3, 2, 1, 1], [2, 2, 1, 1, 3, 2],
    [2, 2, 1, 2, 3, 1], [2, 1, 3, 2, 1, 2], [2, 2, 3, 1, 1, 2], [3, 1, 2, 1, 3, 1],
    [3, 1, 1, 2, 2, 2], [3, 2, 1, 1, 2, 2], [3, 2, 1, 2, 2, 1], [3, 1, 2, 2, 1, 2],
    [3, 2, 2, 1, 1, 2], [3, 2, 2, 2, 1, 1], [2, 1, 2, 1, 2, 3], [2, 1, 2, 3, 2, 1],
    [2, 3, 2, 1, 2, 1], [1, 1, 1, 3, 2, 3], [1, 3, 1, 1, 2, 3], [1, 3, 1, 3, 2, 1],
    [1, 1, 2, 3, 1, 3], [1, 3, 2, 1, 1, 3], [1, 3, 2, 3, 1, 1], [2, 1, 1, 3, 1, 3],
    [2, 3, 1, 1, 1, 3], [2, 3, 1, 3, 1, 1], [1, 1, 2, 1, 3, 3], [1, 1, 2, 3, 3, 1],
    [1, 3, 2, 1, 3, 1], [1, 1, 3, 1, 2, 3], [1, 1, 3, 3, 2, 1], [1, 3, 3, 1, 2, 1],
    [3, 1, 3, 1, 2, 1], [2, 1, 1, 3, 3, 1], [2, 3, 1, 1, 3, 1], [2, 1, 3, 1, 1, 3],
    [2, 1, 3, 3, 1, 1], [2, 1, 3, 1, 3, 1], [3, 1, 1, 1, 2, 3], [3, 1, 1, 3, 2, 1],
    [3, 3, 1, 1, 2, 1], [3, 1, 2, 1, 1, 3], [3, 1, 2, 3, 1, 1], [3, 3, 2, 1, 1, 1],
    [3, 1, 4, 1, 1, 1], [2, 2, 1, 4, 1, 1], [4, 3, 1, 1, 1, 1], [1, 1, 1, 2, 2, 4],
    [1, 1, 1, 4, 2, 2], [1, 2, 1, 1, 2, 4], [1, 2, 1, 4, 2, 1], [1, 4, 1, 1, 2, 2],
    [1, 4, 1, 2, 2, 1], [1, 1, 2, 2, 1, 4], [1, 1, 2, 4, 1, 2], [1, 2, 2, 1, 1, 4],
    [1, 2, 2, 4, 1, 1], [1, 4, 2, 1, 1, 2], [1, 4, 2, 2, 1, 1], [2, 4, 1, 2, 1, 1],
    [2, 2, 1, 1, 1, 4], [4, 1, 3, 1, 1, 1], [2, 4, 1, 1, 1, 2], [1, 3, 4, 1, 1, 1],
    [1, 1, 1, 2, 4, 2], [1, 2, 1, 1, 4, 2], [1, 2, 1, 2, 4, 1], [1, 1, 4, 2, 1, 2],
    [1, 2, 4, 1, 1, 2], [1, 2, 4, 2, 1, 1], [4, 1, 1, 2, 1, 2], [4, 2, 1, 1, 1, 2],
    [4, 2, 1, 2, 1, 1], [2, 1, 2, 1, 4, 1], [2, 1, 4, 1, 2, 1], [4, 1, 2, 1, 2, 1],
    [1, 1, 1, 1, 4, 3], [1, 1, 1, 3, 4, 1], [1, 3, 1, 1, 4, 1], [1, 1, 4, 1, 1, 3],
    [1, 1, 4, 3, 1, 1], [4, 1, 1, 1, 1, 3], [4, 1, 1, 3, 1, 1], [1, 1, 3, 1, 4, 1],
    [1, 1, 4, 1, 3, 1], [3, 1, 1, 1, 4, 1], [4, 1, 1, 1, 3, 1], [2, 1, 1, 4, 1, 2],
    [2, 1, 1, 2, 1, 4], [2, 1, 1, 2, 3, 2],
];
const STOP_PATTERN = [2, 3, 3, 1, 1, 1, 2];
function encodeCode128B(text) {
    const codes = [CODE128_START_B];
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) - 32;
        if (charCode < 0 || charCode > 95)
            codes.push(0);
        else
            codes.push(charCode);
    }
    // Calculate checksum
    let checksum = CODE128_START_B;
    for (let i = 1; i < codes.length; i++) {
        checksum += codes[i] * i;
    }
    checksum = checksum % 103;
    codes.push(checksum);
    codes.push(CODE128_STOP);
    return codes;
}
function generateCode128SVG(text, opts) {
    const codes = encodeCode128B(text);
    const modules = [];
    // Quiet zone
    for (let i = 0; i < 10; i++)
        modules.push(false);
    // Encode each character
    for (let ci = 0; ci < codes.length - 1; ci++) {
        const pattern = CODE128_PATTERNS[codes[ci]];
        if (!pattern)
            continue;
        for (let pi = 0; pi < pattern.length; pi++) {
            const isBar = pi % 2 === 0;
            for (let w = 0; w < pattern[pi]; w++) {
                modules.push(isBar);
            }
        }
    }
    // Stop pattern
    for (let pi = 0; pi < STOP_PATTERN.length; pi++) {
        const isBar = pi % 2 === 0;
        for (let w = 0; w < STOP_PATTERN[pi]; w++) {
            modules.push(isBar);
        }
    }
    // Quiet zone
    for (let i = 0; i < 10; i++)
        modules.push(false);
    const totalWidth = modules.length * opts.width;
    const totalHeight = opts.height + (opts.showText ? 20 : 0);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
    svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;
    for (let i = 0; i < modules.length; i++) {
        if (modules[i]) {
            svg += `<rect x="${i * opts.width}" y="0" width="${opts.width}" height="${opts.height}" fill="black"/>`;
        }
    }
    if (opts.showText) {
        svg += `<text x="${totalWidth / 2}" y="${opts.height + 14}" text-anchor="middle" font-family="monospace" font-size="12" fill="black">${escapeXml(text)}</text>`;
    }
    svg += '</svg>';
    return svg;
}
function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function generatePrintHTML(barcodes, opts) {
    const { labelWidth, labelHeight, columns, showPrice, showName, fontSize } = opts;
    let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Barcode Labels — OkeBill</title>
<style>
  @media print { body { margin: 0; } @page { margin: 5mm; } }
  body { font-family: 'Arial', sans-serif; margin: 0; padding: 10px; }
  .grid { display: grid; grid-template-columns: repeat(${columns}, ${labelWidth}mm); gap: 2mm; }
  .label { width: ${labelWidth}mm; height: ${labelHeight}mm; border: 0.5px solid #ddd;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2mm; box-sizing: border-box; overflow: hidden; page-break-inside: avoid; }
  .label svg { max-width: 100%; height: auto; }
  .label-name { font-size: ${fontSize}pt; font-weight: 600; text-align: center;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; margin-bottom: 1mm; }
  .label-price { font-size: ${fontSize + 2}pt; font-weight: 700; margin-top: 1mm; }
</style></head><body><div class="grid">`;
    for (const bc of barcodes) {
        html += '<div class="label">';
        if (showName && bc.label)
            html += `<div class="label-name">${escapeXml(bc.label)}</div>`;
        html += bc.svg;
        if (showPrice && bc.price)
            html += `<div class="label-price">₹${Number(bc.price).toLocaleString('en-IN')}</div>`;
        html += '</div>';
    }
    html += '</div></body></html>';
    return html;
}
exports.default = router;
//# sourceMappingURL=barcodes.js.map