"use client";

import * as React from "react";
import {
  Box,
  Calendar,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  Tags,
  Trash2,
  FilePenLine,
  Package,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const mockProducts = [
  {
    id: "prod_1",
    name: "Magnesium Glycinate",
    sku: "MAG-GLY-400",
    category: "Supplements",
    price: 28.99,
    status: "Unknown",
  },
  {
    id: "prod_2",
    name: "Multivitamin Women",
    sku: "MULTI-WOM",
    category: "Supplements",
    price: 39.99,
    status: "Unknown",
  },
  {
    id: "prod_3",
    name: "Omega-3 Fish Oil",
    sku: "OMEGA3-1000",
    category: "Supplements",
    price: 34.99,
    status: "Unknown",
  },
  {
    id: "prod_4",
    name: "Probiotic Complex",
    sku: "PROB-COMP",
    category: "Supplements",
    price: 44.99,
    status: "Unknown",
  },
  {
    id: "prod_5",
    name: "Vitamin D3 5000 IU",
    sku: "VIT-D3-5000",
    category: "Supplements",
    price: 24.99,
    status: "Unknown",
  },
];

const FilterButton = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <Button
    variant={isActive ? "default" : "outline"}
    size="sm"
    onClick={onClick}
    className="h-8"
  >
    {label}
  </Button>
);

const StatusBadge = ({ status }: { status: string }) => {
    let className = "bg-gray-100 text-gray-800";
    if (status === "Unknown") {
        className = "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
    return <Badge className={className}>{status}</Badge>;
};

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [activeStatus, setActiveStatus] = React.useState("All Status");

  const categories = ["All", "Hair", "Mental Health", "Prescriptions", "Supplements", "Telehealth", "Women's Health"];
  const statuses = ["All Status", "Active", "Draft"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products & Subscriptions</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="bg-transparent p-0 border-b-2 rounded-none gap-6">
          <TabsTrigger value="products" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
            <Package className="mr-2 h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="subscription_plans" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
            <Layers className="mr-2 h-4 w-4" /> Subscription Plans
          </TabsTrigger>
           <TabsTrigger value="billing_cycles" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
            <Calendar className="mr-2 h-4 w-4" /> Billing Cycles
          </TabsTrigger>
           <TabsTrigger value="bundles" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
            <Box className="mr-2 h-4 w-4" /> Bundles
          </TabsTrigger>
           <TabsTrigger value="services" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
            <Settings className="mr-2 h-4 w-4" /> Services
          </TabsTrigger>
           <TabsTrigger value="categories" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
            <Tags className="mr-2 h-4 w-4" /> Categories
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="relative w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search products..." className="pl-9" />
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    {categories.map((category) => (
                        <FilterButton
                        key={category}
                        label={category}
                        isActive={activeCategory === category}
                        onClick={() => setActiveCategory(category)}
                        />
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    {statuses.map((status) => (
                        <FilterButton
                        key={status}
                        label={status}
                        isActive={activeStatus === status}
                        onClick={() => setActiveStatus(status)}
                        />
                    ))}
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FilePenLine className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-sm text-muted-foreground mt-4">
                {mockProducts.length} products found
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
