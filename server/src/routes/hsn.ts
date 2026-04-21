import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── Common HSN/SAC codes for Indian businesses ───────────────
// This is an embedded master list of the most commonly used codes.
// Covers: IT services, consulting, manufacturing, trading, food, textiles, etc.
const HSN_MASTER: { code: string; description: string; gstRate: number }[] = [
    // ── SAC Codes (Services) ──────────────────────────────
    { code: '9971', description: 'Financial and related services', gstRate: 18 },
    { code: '9972', description: 'Real estate services', gstRate: 18 },
    { code: '9973', description: 'Leasing or rental services', gstRate: 18 },
    { code: '9981', description: 'Research and development services', gstRate: 18 },
    { code: '9982', description: 'Legal and accounting services', gstRate: 18 },
    { code: '9983', description: 'Other professional, technical and business services', gstRate: 18 },
    { code: '998311', description: 'Management consulting services', gstRate: 18 },
    { code: '998312', description: 'Business consulting services', gstRate: 18 },
    { code: '998313', description: 'IT consulting services', gstRate: 18 },
    { code: '998314', description: 'IT design and development services', gstRate: 18 },
    { code: '998315', description: 'Hosting and IT infrastructure provisioning', gstRate: 18 },
    { code: '998316', description: 'IT infrastructure and network management', gstRate: 18 },
    { code: '9984', description: 'Telecommunications, broadcasting and information supply', gstRate: 18 },
    { code: '998411', description: 'Internet telecommunications services', gstRate: 18 },
    { code: '998412', description: 'Online content services', gstRate: 18 },
    { code: '998421', description: 'Programming (TV/Radio) services', gstRate: 18 },
    { code: '9985', description: 'Support services', gstRate: 18 },
    { code: '998511', description: 'Staffing services', gstRate: 18 },
    { code: '998512', description: 'Labour supply services', gstRate: 18 },
    { code: '998513', description: 'Security services', gstRate: 18 },
    { code: '9986', description: 'Support services for agriculture, hunting, forestry, fishing', gstRate: 18 },
    { code: '9987', description: 'Maintenance, repair and installation services', gstRate: 18 },
    { code: '998711', description: 'Maintenance and repair of motor vehicles', gstRate: 18 },
    { code: '998712', description: 'Maintenance and repair of machinery', gstRate: 18 },
    { code: '998713', description: 'Maintenance and repair of computers', gstRate: 18 },
    { code: '9988', description: 'Manufacturing services on physical inputs', gstRate: 18 },
    { code: '9989', description: 'Other manufacturing services', gstRate: 18 },
    { code: '9991', description: 'Public administration services', gstRate: 18 },
    { code: '9992', description: 'Education services', gstRate: 18 },
    { code: '9993', description: 'Human health and social care services', gstRate: 18 },
    { code: '9994', description: 'Sewage and waste collection, treatment and disposal', gstRate: 18 },
    { code: '9995', description: 'Services of membership organisations', gstRate: 18 },
    { code: '9996', description: 'Recreational, cultural and sporting services', gstRate: 18 },
    { code: '9997', description: 'Other services', gstRate: 18 },
    { code: '996311', description: 'Hotel accommodation services', gstRate: 12 },
    { code: '996312', description: 'Restaurant services', gstRate: 5 },
    { code: '996411', description: 'Passenger transport by rail', gstRate: 5 },
    { code: '996412', description: 'Passenger transport by road', gstRate: 5 },
    { code: '996511', description: 'Goods transport by road', gstRate: 5 },
    { code: '996512', description: 'Goods transport by rail', gstRate: 5 },
    { code: '996601', description: 'Courier services', gstRate: 18 },
    { code: '997211', description: 'Renting of residential dwelling', gstRate: 18 },
    { code: '997212', description: 'Renting of commercial property', gstRate: 18 },

    // ── HSN Codes (Goods) ─────────────────────────────────
    // Computers & Electronics
    { code: '8471', description: 'Computers and data processing equipment', gstRate: 18 },
    { code: '847130', description: 'Laptops and portable computers', gstRate: 18 },
    { code: '847150', description: 'Computer processing units (desktops)', gstRate: 18 },
    { code: '8473', description: 'Computer parts and accessories', gstRate: 18 },
    { code: '8523', description: 'Discs, tapes, solid-state storage devices', gstRate: 18 },
    { code: '8517', description: 'Telephones, smartphones, and parts', gstRate: 18 },
    { code: '8528', description: 'Monitors, projectors, TV receivers', gstRate: 18 },
    { code: '8443', description: 'Printers, copying machines, fax machines', gstRate: 18 },
    { code: '8504', description: 'Electrical transformers, UPS', gstRate: 18 },
    { code: '8544', description: 'Insulated wire, cable, optical fibre cable', gstRate: 18 },

    // Software & Digital
    { code: '8524', description: 'Records, tapes and other media containing software', gstRate: 18 },
    { code: '4907', description: 'Printed stamps, stamp-impressed paper', gstRate: 12 },

    // Office Supplies
    { code: '4820', description: 'Registers, account books, diaries, memo pads', gstRate: 12 },
    { code: '4821', description: 'Paper and paperboard labels', gstRate: 12 },
    { code: '9608', description: 'Ball pens, felt pens, markers', gstRate: 18 },
    { code: '9403', description: 'Office furniture', gstRate: 18 },
    { code: '9405', description: 'Lamps and lighting fittings', gstRate: 18 },

    // Food & Beverages
    { code: '0201', description: 'Meat of bovine animals, fresh or chilled', gstRate: 0 },
    { code: '0401', description: 'Milk and cream, not concentrated or sweetened', gstRate: 0 },
    { code: '0402', description: 'Milk and cream, concentrated or sweetened', gstRate: 5 },
    { code: '0713', description: 'Dried leguminous vegetables (dal, lentils)', gstRate: 0 },
    { code: '1001', description: 'Wheat and meslin', gstRate: 0 },
    { code: '1006', description: 'Rice', gstRate: 5 },
    { code: '1101', description: 'Wheat or meslin flour (atta)', gstRate: 0 },
    { code: '1701', description: 'Cane or beet sugar', gstRate: 5 },
    { code: '1901', description: 'Food preparations of flour or starch', gstRate: 18 },
    { code: '1905', description: 'Bread, pastry, cakes, biscuits', gstRate: 18 },
    { code: '2106', description: 'Food preparations not elsewhere specified', gstRate: 18 },
    { code: '2201', description: 'Mineral waters and aerated waters', gstRate: 18 },
    { code: '2202', description: 'Soft drinks, sweetened/flavoured water', gstRate: 28 },

    // Textiles & Garments
    { code: '5208', description: 'Woven fabrics of cotton', gstRate: 5 },
    { code: '5209', description: 'Woven fabrics of cotton (heavier)', gstRate: 5 },
    { code: '6101', description: 'Men\'s overcoats, jackets (knitted)', gstRate: 12 },
    { code: '6104', description: 'Women\'s suits, dresses (knitted)', gstRate: 12 },
    { code: '6109', description: 'T-shirts, singlets (knitted)', gstRate: 5 },
    { code: '6110', description: 'Jerseys, pullovers, cardigans (knitted)', gstRate: 12 },
    { code: '6203', description: 'Men\'s suits, trousers (not knitted)', gstRate: 12 },
    { code: '6204', description: 'Women\'s suits, dresses (not knitted)', gstRate: 12 },
    { code: '6302', description: 'Bed linen, table linen, toilet linen', gstRate: 5 },

    // Pharmaceuticals & Medical
    { code: '3003', description: 'Medicaments (not pre-packaged)', gstRate: 12 },
    { code: '3004', description: 'Medicaments for therapeutic use (packaged)', gstRate: 12 },
    { code: '3005', description: 'Bandages and similar articles', gstRate: 18 },
    { code: '3006', description: 'Pharmaceutical goods (surgical sutures, etc.)', gstRate: 12 },
    { code: '9018', description: 'Medical instruments and appliances', gstRate: 12 },
    { code: '9019', description: 'Mechano-therapy appliances, massage apparatus', gstRate: 12 },

    // Automotive
    { code: '8703', description: 'Motor cars and vehicles for transport of persons', gstRate: 28 },
    { code: '8704', description: 'Motor vehicles for transport of goods', gstRate: 28 },
    { code: '8711', description: 'Motorcycles and cycles with motor', gstRate: 28 },
    { code: '8714', description: 'Parts and accessories for motorcycles/cycles', gstRate: 28 },
    { code: '4011', description: 'New pneumatic tyres of rubber', gstRate: 28 },

    // Construction & Building
    { code: '2523', description: 'Portland cement, aluminous cement', gstRate: 28 },
    { code: '6802', description: 'Monumental or building stone', gstRate: 18 },
    { code: '6907', description: 'Ceramic tiles, cubes, mosaic', gstRate: 18 },
    { code: '6910', description: 'Ceramic sinks, washbasins, baths', gstRate: 18 },
    { code: '7210', description: 'Flat-rolled iron or steel, plated or coated', gstRate: 18 },
    { code: '7213', description: 'Bars and rods, hot-rolled iron/steel', gstRate: 18 },
    { code: '7308', description: 'Structures of iron or steel', gstRate: 18 },
    { code: '7318', description: 'Screws, bolts, nuts, washers of iron/steel', gstRate: 18 },
    { code: '7610', description: 'Structures of aluminium', gstRate: 18 },

    // Personal Care & Cosmetics
    { code: '3301', description: 'Essential oils', gstRate: 18 },
    { code: '3304', description: 'Beauty or make-up preparations', gstRate: 28 },
    { code: '3305', description: 'Preparations for use on hair', gstRate: 18 },
    { code: '3306', description: 'Preparations for oral or dental hygiene', gstRate: 18 },
    { code: '3401', description: 'Soap and organic cleaning preparations', gstRate: 18 },
    { code: '3402', description: 'Detergents and cleaning preparations', gstRate: 18 },

    // Packaging
    { code: '3923', description: 'Plastic articles for packing of goods', gstRate: 18 },
    { code: '4819', description: 'Cartons, boxes, corrugated paper or board', gstRate: 18 },
    { code: '7010', description: 'Glass containers (bottles, jars)', gstRate: 18 },

    // Electrical & Energy
    { code: '8501', description: 'Electric motors and generators', gstRate: 18 },
    { code: '8502', description: 'Electric generating sets', gstRate: 18 },
    { code: '8507', description: 'Electric accumulators (batteries)', gstRate: 28 },
    { code: '8541', description: 'Semiconductor devices, LEDs', gstRate: 18 },
    { code: '8541400', description: 'Solar cells and modules', gstRate: 5 },

    // Machinery
    { code: '8401', description: 'Nuclear reactors and parts', gstRate: 18 },
    { code: '8414', description: 'Air or vacuum pumps, compressors, fans', gstRate: 18 },
    { code: '8415', description: 'Air conditioning machines', gstRate: 28 },
    { code: '8418', description: 'Refrigerators, freezers', gstRate: 18 },
    { code: '8422', description: 'Dish washing machines, bottling machines', gstRate: 18 },
    { code: '8450', description: 'Household or laundry-type washing machines', gstRate: 18 },

    // Miscellaneous
    { code: '7113', description: 'Articles of jewellery, gold/silver', gstRate: 3 },
    { code: '7114', description: 'Articles of goldsmiths\' wares', gstRate: 3 },
    { code: '9101', description: 'Wrist-watches, pocket-watches', gstRate: 18 },
    { code: '9503', description: 'Toys, scale models', gstRate: 12 },
    { code: '9506', description: 'Sports equipment', gstRate: 12 },
    { code: '6401', description: 'Waterproof footwear', gstRate: 12 },
    { code: '6402', description: 'Footwear with outer soles of rubber/plastic', gstRate: 18 },
    { code: '6403', description: 'Footwear with leather uppers', gstRate: 18 },
    { code: '4202', description: 'Trunks, suitcases, handbags, wallets', gstRate: 18 },
];

// ─── GET /hsn/search ────────────────────────────────────────
router.get('/search', async (req: AuthRequest, res) => {
    try {
        const query = String(req.query.q || '').trim().toLowerCase();
        const limit = Math.min(Number(req.query.limit) || 20, 50);

        if (!query || query.length < 2) {
            // Return popular/default codes
            res.json({
                results: HSN_MASTER.slice(0, limit).map(h => ({
                    code: h.code,
                    description: h.description,
                    gstRate: h.gstRate,
                })),
                total: HSN_MASTER.length,
            });
            return;
        }

        const results = HSN_MASTER.filter(h =>
            h.code.toLowerCase().includes(query) ||
            h.description.toLowerCase().includes(query)
        ).slice(0, limit);

        res.json({
            results: results.map(h => ({
                code: h.code,
                description: h.description,
                gstRate: h.gstRate,
            })),
            total: results.length,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /hsn/code/:code ────────────────────────────────────
router.get('/code/:code', async (req: AuthRequest, res) => {
    try {
        const code = String(req.params.code || '').trim();
        const match = HSN_MASTER.find(h => h.code === code);
        if (!match) {
            res.status(404).json({ message: 'HSN/SAC code not found' });
            return;
        }
        res.json(match);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
