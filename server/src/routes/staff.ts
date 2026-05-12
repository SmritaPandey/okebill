import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════
// STAFF MEMBERS
// ═══════════════════════════════════════════════════════════

// GET /staff — List all staff members
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { status } = req.query;
        const where: any = { userId: req.userId };
        if (status) where.status = String(status);

        const staff = await prisma.staffMember.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                attendance: {
                    where: {
                        date: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                            lte: new Date(),
                        },
                    },
                },
            },
        });

        // Enrich with attendance stats
        const enriched = staff.map(s => {
            const presentDays = s.attendance.filter(a => a.status === 'present').length;
            const absentDays = s.attendance.filter(a => a.status === 'absent').length;
            const halfDays = s.attendance.filter(a => a.status === 'half_day').length;
            const leaveDays = s.attendance.filter(a => a.status === 'leave').length;
            const totalHours = s.attendance.reduce((sum, a) => sum + Number(a.hoursWorked || 0), 0);

            return {
                ...s,
                thisMonth: { presentDays, absentDays, halfDays, leaveDays, totalHours },
            };
        });

        res.json(enriched);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /staff — Create a staff member
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { name, phone, email, role, salary, salaryType, joiningDate } = req.body;
        if (!name) { res.status(400).json({ message: 'Name is required' }); return; }

        const staff = await prisma.staffMember.create({
            data: {
                userId: req.userId!,
                name,
                phone: phone || null,
                email: email || null,
                role: role || 'staff',
                salary: salary || 0,
                salaryType: salaryType || 'monthly',
                joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            },
        });

        res.status(201).json(staff);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /staff/:id — Update a staff member
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.staffMember.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) { res.status(404).json({ message: 'Staff member not found' }); return; }

        const { name, phone, email, role, salary, salaryType, status } = req.body;

        const staff = await prisma.staffMember.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(name && { name }),
                ...(phone !== undefined && { phone: phone || null }),
                ...(email !== undefined && { email: email || null }),
                ...(role && { role }),
                ...(salary !== undefined && { salary }),
                ...(salaryType && { salaryType }),
                ...(status && { status }),
            },
        });

        res.json(staff);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /staff/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.staffMember.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) { res.status(404).json({ message: 'Staff member not found' }); return; }

        await prisma.staffMember.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════

// GET /staff/attendance/daily?date=2026-05-11
router.get('/attendance/daily', async (req: AuthRequest, res) => {
    try {
        const dateStr = String(req.query.date || new Date().toISOString().split('T')[0]);
        const date = new Date(dateStr);

        // Get all active staff
        const allStaff = await prisma.staffMember.findMany({
            where: { userId: req.userId, status: 'active' },
        });

        // Get attendance records for this date
        const attendance = await prisma.attendance.findMany({
            where: {
                staffId: { in: allStaff.map(s => s.id) },
                date,
            },
            include: { staff: true },
        });

        // Merge staff with their attendance
        const result = allStaff.map(staff => {
            const record = attendance.find(a => a.staffId === staff.id);
            return {
                staff,
                attendance: record || null,
                marked: !!record,
            };
        });

        res.json({ date: dateStr, records: result });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /staff/attendance/mark — Mark attendance for a staff member
router.post('/attendance/mark', async (req: AuthRequest, res) => {
    try {
        const { staffId, date, status, clockIn, clockOut, notes } = req.body;

        // Verify staff belongs to user
        const staff = await prisma.staffMember.findFirst({
            where: { id: Number(staffId), userId: req.userId },
        });
        if (!staff) { res.status(404).json({ message: 'Staff member not found' }); return; }

        const attendanceDate = new Date(date || new Date().toISOString().split('T')[0]);

        // Calculate hours worked
        let hoursWorked: number | null = null;
        if (clockIn && clockOut) {
            const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
            hoursWorked = Math.round((diff / 3600000) * 100) / 100;
        }

        const attendance = await prisma.attendance.upsert({
            where: {
                staffId_date: {
                    staffId: Number(staffId),
                    date: attendanceDate,
                },
            },
            update: {
                status: status || 'present',
                clockIn: clockIn ? new Date(clockIn) : undefined,
                clockOut: clockOut ? new Date(clockOut) : undefined,
                hoursWorked,
                notes: notes || undefined,
            },
            create: {
                staffId: Number(staffId),
                date: attendanceDate,
                status: status || 'present',
                clockIn: clockIn ? new Date(clockIn) : null,
                clockOut: clockOut ? new Date(clockOut) : null,
                hoursWorked,
                notes: notes || null,
            },
        });

        res.json(attendance);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /staff/attendance/bulk — Mark attendance for multiple staff
router.post('/attendance/bulk', async (req: AuthRequest, res) => {
    try {
        const { date, records } = req.body;
        // records: [{ staffId, status, clockIn?, clockOut? }]

        if (!Array.isArray(records) || records.length === 0) {
            res.status(400).json({ message: 'Attendance records array is required' }); return;
        }

        const attendanceDate = new Date(date || new Date().toISOString().split('T')[0]);
        const results = [];

        for (const record of records) {
            const staff = await prisma.staffMember.findFirst({
                where: { id: Number(record.staffId), userId: req.userId },
            });
            if (!staff) continue;

            let hoursWorked: number | null = null;
            if (record.clockIn && record.clockOut) {
                const diff = new Date(record.clockOut).getTime() - new Date(record.clockIn).getTime();
                hoursWorked = Math.round((diff / 3600000) * 100) / 100;
            }

            const attendance = await prisma.attendance.upsert({
                where: {
                    staffId_date: {
                        staffId: Number(record.staffId),
                        date: attendanceDate,
                    },
                },
                update: {
                    status: record.status || 'present',
                    clockIn: record.clockIn ? new Date(record.clockIn) : undefined,
                    clockOut: record.clockOut ? new Date(record.clockOut) : undefined,
                    hoursWorked,
                },
                create: {
                    staffId: Number(record.staffId),
                    date: attendanceDate,
                    status: record.status || 'present',
                    clockIn: record.clockIn ? new Date(record.clockIn) : null,
                    clockOut: record.clockOut ? new Date(record.clockOut) : null,
                    hoursWorked,
                },
            });
            results.push(attendance);
        }

        res.json({ marked: results.length, records: results });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /staff/payroll/summary?month=5&year=2026
router.get('/payroll/summary', async (req: AuthRequest, res) => {
    try {
        const m = Number(req.query.month || new Date().getMonth() + 1);
        const y = Number(req.query.year || new Date().getFullYear());

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0);
        const totalDaysInMonth = endDate.getDate();

        const staff = await prisma.staffMember.findMany({
            where: { userId: req.userId, status: 'active' },
            include: {
                attendance: {
                    where: {
                        date: { gte: startDate, lte: endDate },
                    },
                },
            },
        });

        const payroll = staff.map(s => {
            const presentDays = s.attendance.filter(a => a.status === 'present').length;
            const halfDays = s.attendance.filter(a => a.status === 'half_day').length;
            const leaveDays = s.attendance.filter(a => a.status === 'leave').length;
            const absentDays = s.attendance.filter(a => a.status === 'absent').length;
            const effectiveDays = presentDays + (halfDays * 0.5);
            const totalHours = s.attendance.reduce((sum, a) => sum + Number(a.hoursWorked || 0), 0);

            let calculatedSalary = 0;
            if (s.salaryType === 'monthly') {
                calculatedSalary = (Number(s.salary) / totalDaysInMonth) * effectiveDays;
            } else if (s.salaryType === 'daily') {
                calculatedSalary = Number(s.salary) * effectiveDays;
            } else if (s.salaryType === 'hourly') {
                calculatedSalary = Number(s.salary) * totalHours;
            }

            return {
                staffId: s.id,
                name: s.name,
                role: s.role,
                baseSalary: Number(s.salary),
                salaryType: s.salaryType,
                presentDays,
                halfDays,
                leaveDays,
                absentDays,
                effectiveDays,
                totalHours,
                totalDaysInMonth,
                calculatedSalary: Math.round(calculatedSalary * 100) / 100,
            };
        });

        const totalPayroll = payroll.reduce((sum, p) => sum + p.calculatedSalary, 0);

        res.json({
            month: m,
            year: y,
            totalStaff: payroll.length,
            totalPayroll: Math.round(totalPayroll * 100) / 100,
            payroll,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
