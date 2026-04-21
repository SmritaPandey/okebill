import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Receipt,
  FileText,
  AlertTriangle
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState("this_month");

  const reportTypes = [
    {
      id: "sales_summary",
      name: "Sales Summary",
      description: "Overview of sales performance and trends",
      icon: BarChart3,
      category: "Sales"
    },
    {
      id: "inventory_report",
      name: "Inventory Report",
      description: "Stock levels, low stock alerts, and expiry tracking",
      icon: Package,
      category: "Inventory"
    },
    {
      id: "customer_analysis",
      name: "Customer Analysis",
      description: "Customer behavior and purchase patterns",
      icon: Users,
      category: "Customers"
    },
    {
      id: "financial_summary",
      name: "Financial Summary",
      description: "Revenue, expenses, and profit analysis",
      icon: DollarSign,
      category: "Finance"
    },
    {
      id: "tax_report",
      name: "Tax Report",
      description: "Tax calculations and compliance reports",
      icon: FileText,
      category: "Compliance"
    },
    {
      id: "product_performance",
      name: "Product Performance",
      description: "Best and worst performing products",
      icon: TrendingUp,
      category: "Products"
    }
  ];

  const quickStats = [
    {
      title: "Total Sales",
      value: "$45,231.89",
      change: "+20.1%",
      icon: DollarSign,
      positive: true
    },
    {
      title: "Transactions",
      value: "1,234",
      change: "+15.3%",
      icon: Receipt,
      positive: true
    },
    {
      title: "Low Stock Items",
      value: "23",
      change: "+5",
      icon: AlertTriangle,
      positive: false
    },
    {
      title: "Active Customers",
      value: "573",
      change: "+12.5%",
      icon: Users,
      positive: true
    }
  ];

  const generateReport = () => {
    // Mock report generation
    console.log(`Generating ${selectedReport} for ${dateRange}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-2 text-gray-600">
              Generate insights and reports for your business
            </p>
          </div>
          <Button onClick={generateReport} disabled={!selectedReport}>
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs">
                    <span className={stat.positive ? "text-green-600" : "text-red-600"}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground ml-1">from last period</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Select report type and date range to generate analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="last_week">Last Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="this_quarter">This Quarter</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Reports */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedReport === report.id ? "ring-2 ring-emerald-500 bg-emerald-50" : ""
                    }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {report.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{report.description}</CardDescription>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Last generated: 2 days ago
                      </span>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Previously generated reports and scheduled reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Sales Summary - March 2024",
                  type: "Sales",
                  generated: "2 hours ago",
                  size: "2.3 MB",
                  format: "PDF"
                },
                {
                  name: "Inventory Report - Weekly",
                  type: "Inventory",
                  generated: "1 day ago",
                  size: "1.8 MB",
                  format: "Excel"
                },
                {
                  name: "Tax Report - Q1 2024",
                  type: "Compliance",
                  generated: "3 days ago",
                  size: "856 KB",
                  format: "PDF"
                }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{report.name}</p>
                      <p className="text-sm text-gray-600">
                        {report.type} • {report.generated} • {report.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{report.format}</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout >
  );
}

export default ReportsPage;
