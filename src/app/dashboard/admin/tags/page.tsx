
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  Tag,
  Users,
  Calendar,
  FilePenLine,
  Trash2,
  Download,
  ChevronsUpDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type TagItem = {
  id: string;
  name: string;
  color: string;
  patientCount: number;
  createdAt: string;
  description: string;
};

const mockTags: TagItem[] = [
  { id: "1", name: "Urgent", color: "#EF4444", patientCount: 15, createdAt: "Jan 1, 2024", description: "Critical items requiring immediate attention." },
  { id: "2", name: "Follow-up Required", color: "#EAB308", patientCount: 23, createdAt: "Jan 5, 2024", description: "Patients or tasks needing a follow-up action." },
  { id: "3", name: "Completed", color: "#22C55E", patientCount: 45, createdAt: "Jan 10, 2024", description: "Tasks or processes that have been successfully finished." },
  { id: "4", name: "In Progress", color: "#3B82F6", patientCount: 12, createdAt: "Jan 15, 2024", description: "Items currently being worked on." },
  { id: "5", name: "High Priority", color: "#F97316", patientCount: 8, createdAt: "Jan 20, 2024", description: "Tasks or patients requiring top priority." },
  { id: "6", name: "Reviewed", color: "#A855F7", patientCount: 30, createdAt: "Jan 25, 2024", description: "Documents or notes that have been reviewed." },
  { id: "7", name: "Needs Attention", color: "#6366F1", patientCount: 10, createdAt: "Jan 30, 2024", description: "Items that require further investigation or action." },
];

const tagUsageData = [
    { name: 'Medication Re...', value: 87 },
    { name: 'New Patient', value: 98 },
    { name: 'Follow-up Req...', value: 134 },
    { name: 'Hypertension', value: 189 },
    { name: 'Diabetes', value: 245 },
    { name: 'High Priority', value: 285 },
];

const patientsByTagCountData = [
    { name: '4+ Tags', value: 265, percentage: 26.5, color: 'bg-blue-800' },
    { name: '2-3 Tags', value: 345, percentage: 34.5, color: 'bg-blue-600' },
    { name: '1 Tag', value: 234, percentage: 23.4, color: 'bg-blue-400' },
    { name: 'Untagged', value: 156, percentage: 15.6, color: 'bg-gray-300' },
];

const StatCard = ({ title, value, icon: Icon, color, extra }: { title: string, value: string, icon: React.ElementType, color: string, extra?: string }) => (
    <Card className={`bg-gradient-to-br ${color} border-0`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
            <Icon className="h-5 w-5 text-white/80" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold text-white">{value}</div>
            {extra && <p className="text-xs text-white/80 mt-1">{extra}</p>}
        </CardContent>
    </Card>
);

const CustomYAxisTick = ({ y, payload }: any) => {
    return (
      <g transform={`translate(0,${y})`}>
        <text x={0} y={0} dy={4} textAnchor="start" fill="#666" className="text-xs">
          {payload.value.length > 15 ? `${payload.value.substring(0, 15)}...` : payload.value}
        </text>
      </g>
    );
};
  

export default function TagsPage() {
  const [isAnalyticsCollapsed, setIsAnalyticsCollapsed] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Tag Analytics</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            Last 30 days
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                            <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                            <DropdownMenuItem>Last 90 days</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setIsAnalyticsCollapsed(!isAnalyticsCollapsed)}>
                        {isAnalyticsCollapsed ? 'Expand' : 'Collapse'}
                    </Button>
                </div>
            </CardHeader>
            {!isAnalyticsCollapsed && (
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Tags" value="7" icon={Tag} color="from-blue-400 to-blue-600" />
                        <StatCard title="Total Patients" value="1,000" icon={Users} color="from-green-400 to-green-600" />
                        <StatCard title="Avg Tags/Patient" value="2.3" icon={TrendingUp} color="from-purple-400 to-purple-600" />
                        <StatCard title="Most Used Tag" value="High Priority" icon={Tag} color="from-orange-400 to-orange-600" extra="285 patients" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Tag Usage Distribution</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={tagUsageData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={<CustomYAxisTick />} width={120} />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                        <Bar dataKey="value" fill="#3B82F6" barSize={15} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="text-base">Patients by Tag Count</CardTitle>
                                <Button variant="outline" size="sm" className="h-8"><Download className="h-3 w-3 mr-2" /> Export CSV</Button>
                            </CardHeader>
                             <CardContent>
                                <div className="space-y-3">
                                {patientsByTagCountData.map(item => (
                                    <div key={item.name} className="flex items-center">
                                        <span className={`h-3 w-3 rounded-full ${item.color} mr-3`}></span>
                                        <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                                        <span className="text-sm font-medium">{item.value.toLocaleString()} ({item.percentage}%)</span>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            )}
        </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Tags ({mockTags.length} total)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tags..." className="pl-9 h-9" />
                </div>
                <Button variant="outline" className="h-9"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                <Button className="h-9">
                    <Plus className="mr-2 h-4 w-4" /> Add Tag
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"><Checkbox /></TableHead>
                <TableHead>Tag Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Patient Count</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTags.map((tag) => (
                <TableRow key={tag.id}>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                            <span className="font-medium">{tag.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tag.description}</TableCell>
                    <TableCell>{tag.patientCount}</TableCell>
                    <TableCell>{tag.createdAt}</TableCell>
                    <TableCell>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><FilePenLine className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {mockTags.length} of {mockTags.length} results</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
}

