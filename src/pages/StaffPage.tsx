import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, Plus, Search, Calendar, Clock, CheckCircle, XCircle,
  IndianRupee, RefreshCw, UserCheck, UserMinus, UserPlus,
  ClipboardList, Wallet, Timer, Coffee
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type Tab = 'staff' | 'attendance' | 'payroll';

interface StaffMember {
  id: number; name: string; phone: string | null; email: string | null;
  role: string; salary: number; salaryType: string;
  joiningDate: string; status: string;
  thisMonth?: { presentDays: number; absentDays: number; halfDays: number; leaveDays: number; totalHours: number };
}

interface AttendanceRecord {
  staff: StaffMember;
  attendance: { id: number; status: string; clockIn: string | null; clockOut: string | null; hoursWorked: number | null } | null;
  marked: boolean;
}

interface PayrollEntry {
  staffId: number; name: string; role: string; baseSalary: number;
  salaryType: string; presentDays: number; halfDays: number;
  leaveDays: number; absentDays: number; effectiveDays: number;
  totalHours: number; totalDaysInMonth: number; calculatedSalary: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-zinc-100 text-zinc-600',
  terminated: 'bg-red-100 text-red-700',
  present: 'bg-emerald-100 text-emerald-700', absent: 'bg-red-100 text-red-700',
  half_day: 'bg-amber-100 text-amber-700', leave: 'bg-blue-100 text-blue-700',
};

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) => (
  <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm text-zinc-500 font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-zinc-900">{value}</p>
    {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
  </div>
);

const StaffPage: React.FC = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('staff');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [payrollTotal, setPayrollTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', role: 'staff', salary: '', salaryType: 'monthly',
  });

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API}/staff`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  const fetchAttendance = async (date: string) => {
    try {
      const res = await fetch(`${API}/staff/attendance/daily?date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAttendanceRecords(data.records || []);
    } catch { toast.error('Failed to load attendance'); }
  };

  const fetchPayroll = async () => {
    try {
      const now = new Date();
      const res = await fetch(`${API}/staff/payroll/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPayroll(data.payroll || []);
      setPayrollTotal(data.totalPayroll || 0);
    } catch { toast.error('Failed to load payroll'); }
  };

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { if (tab === 'attendance') fetchAttendance(selectedDate); }, [tab, selectedDate]);
  useEffect(() => { if (tab === 'payroll') fetchPayroll(); }, [tab]);

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      const res = await fetch(`${API}/staff`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, salary: Number(form.salary) || 0 }),
      });
      if (res.ok) {
        toast.success('Staff member added');
        setShowCreate(false);
        setForm({ name: '', phone: '', email: '', role: 'staff', salary: '', salaryType: 'monthly' });
        fetchStaff();
      } else { const err = await res.json(); toast.error(err.message); }
    } catch { toast.error('Network error'); }
  };

  const markAttendance = async (staffId: number, status: string) => {
    try {
      const res = await fetch(`${API}/staff/attendance/mark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          staffId, date: selectedDate, status,
          clockIn: status === 'present' ? new Date().toISOString() : undefined,
        }),
      });
      if (res.ok) { toast.success('Attendance marked'); fetchAttendance(selectedDate); }
    } catch { toast.error('Network error'); }
  };

  const activeStaff = staff.filter(s => s.status === 'active');

  const tabs = [
    { id: 'staff' as Tab, label: 'Staff Members', icon: Users, count: staff.length },
    { id: 'attendance' as Tab, label: 'Attendance', icon: ClipboardList, count: activeStaff.length },
    { id: 'payroll' as Tab, label: 'Payroll', icon: Wallet, count: undefined },
  ];

  const renderStaffList = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Staff" value={staff.length.toString()} color="bg-blue-500" />
        <StatCard icon={UserCheck} label="Active" value={activeStaff.length.toString()} color="bg-emerald-500" />
        <StatCard icon={IndianRupee} label="Monthly Payroll" value={`₹${activeStaff.reduce((s, st) => s + Number(st.salary), 0).toLocaleString('en-IN')}`} color="bg-purple-500" />
        <StatCard icon={UserMinus} label="Inactive" value={staff.filter(s => s.status !== 'active').length.toString()} color="bg-amber-500" />
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 mb-6">
          <h3 className="text-lg font-semibold">Add Staff Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Phone</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Salary (₹)</label>
              <Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="Monthly salary" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Salary Type</label>
              <select value={form.salaryType} onChange={e => setForm({ ...form, salaryType: e.target.value })} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm">
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Add Staff</Button>
            <Button onClick={() => setShowCreate(false)} variant="outline" className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No staff members yet</p>
            <p className="text-xs mt-1">Add your team members to track attendance and payroll</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  {['Name', 'Role', 'Phone', 'Salary', 'Type', 'This Month', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(s => (
                  <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          {s.email && <div className="text-xs text-zinc-400">{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 capitalize">{s.role}</td>
                    <td className="px-4 py-3.5 text-zinc-500">{s.phone || '—'}</td>
                    <td className="px-4 py-3.5 font-bold">₹{Number(s.salary).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5 capitalize text-zinc-500 text-xs">{s.salaryType}</td>
                    <td className="px-4 py-3.5">
                      {s.thisMonth ? (
                        <div className="flex gap-2 text-xs">
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">{s.thisMonth.presentDays}P</span>
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">{s.thisMonth.absentDays}A</span>
                          <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded">{s.thisMonth.halfDays}H</span>
                        </div>
                      ) : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[s.status] || ''}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderAttendance = () => (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="rounded-xl w-44" />
        </div>
        <div className="text-sm text-zinc-500">
          {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CheckCircle} label="Present" value={attendanceRecords.filter(r => r.attendance?.status === 'present').length.toString()} color="bg-emerald-500" />
        <StatCard icon={XCircle} label="Absent" value={attendanceRecords.filter(r => r.attendance?.status === 'absent').length.toString()} color="bg-red-500" />
        <StatCard icon={Coffee} label="Half Day" value={attendanceRecords.filter(r => r.attendance?.status === 'half_day').length.toString()} color="bg-amber-500" />
        <StatCard icon={Timer} label="Not Marked" value={attendanceRecords.filter(r => !r.marked).length.toString()} color="bg-zinc-500" />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {attendanceRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No staff to mark attendance for</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  {['Staff', 'Role', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {attendanceRecords.map(r => (
                  <tr key={r.staff.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {r.staff.name.charAt(0)}
                        </div>
                        <span className="font-medium">{r.staff.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 capitalize text-zinc-500">{r.staff.role}</td>
                    <td className="px-4 py-3.5 text-zinc-500 text-xs">
                      {r.attendance?.clockIn ? new Date(r.attendance.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 text-xs">
                      {r.attendance?.clockOut ? new Date(r.attendance.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">
                      {r.attendance?.hoursWorked ? `${r.attendance.hoursWorked}h` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.marked ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[r.attendance?.status || ''] || ''}`}>
                          {r.attendance?.status?.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500">
                          Not Marked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => markAttendance(r.staff.id, 'present')} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100" title="Present">P</button>
                        <button onClick={() => markAttendance(r.staff.id, 'absent')} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100" title="Absent">A</button>
                        <button onClick={() => markAttendance(r.staff.id, 'half_day')} className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100" title="Half Day">H</button>
                        <button onClick={() => markAttendance(r.staff.id, 'leave')} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100" title="Leave">L</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderPayroll = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Wallet} label="Total Payroll" value={`₹${payrollTotal.toLocaleString('en-IN')}`} sub="This month" color="bg-purple-500" />
        <StatCard icon={Users} label="Staff Count" value={payroll.length.toString()} color="bg-blue-500" />
        <StatCard icon={IndianRupee} label="Avg Salary" value={`₹${payroll.length > 0 ? Math.round(payrollTotal / payroll.length).toLocaleString('en-IN') : '0'}`} color="bg-teal-500" />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {payroll.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Wallet className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No payroll data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  {['Staff', 'Role', 'Base Salary', 'Type', 'Present', 'Absent', 'Half', 'Leave', 'Effective Days', 'Calculated Salary'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payroll.map(p => (
                  <tr key={p.staffId} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold">{p.name}</td>
                    <td className="px-4 py-3.5 capitalize text-zinc-500">{p.role}</td>
                    <td className="px-4 py-3.5">₹{p.baseSalary.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5 capitalize text-xs text-zinc-400">{p.salaryType}</td>
                    <td className="px-4 py-3.5 text-emerald-600 font-medium">{p.presentDays}</td>
                    <td className="px-4 py-3.5 text-red-600 font-medium">{p.absentDays}</td>
                    <td className="px-4 py-3.5 text-amber-600">{p.halfDays}</td>
                    <td className="px-4 py-3.5 text-blue-600">{p.leaveDays}</td>
                    <td className="px-4 py-3.5 font-medium">{p.effectiveDays}/{p.totalDaysInMonth}</td>
                    <td className="px-4 py-3.5 font-bold text-lg text-emerald-700">₹{p.calculatedSalary.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                  <td colSpan={9} className="px-4 py-3.5 text-right font-bold text-zinc-700">Total Payroll</td>
                  <td className="px-4 py-3.5 font-bold text-lg text-emerald-700">₹{payrollTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Staff & Payroll</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage staff members, track attendance, and calculate payroll</p>
          </div>
          {tab === 'staff' && (
            <Button onClick={() => setShowCreate(!showCreate)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
              <UserPlus className="w-4 h-4" /> Add Staff
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search (Staff tab only) */}
        {tab === 'staff' && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
          </div>
        )}

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <>
            {tab === 'staff' && renderStaffList()}
            {tab === 'attendance' && renderAttendance()}
            {tab === 'payroll' && renderPayroll()}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default StaffPage;
