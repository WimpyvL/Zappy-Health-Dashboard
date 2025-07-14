
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
  CardFooter
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

const mockCategories = [
    { id: "", name: "Telehealth", description: "Virtual healthcare consultations", products: 0, status: "Unknown" },
    { id: "", name: "Prescriptions", description: "Prescription medications and refills", products: 0, status: "Unknown" },
    { id: "", name: "Lab Tests", description: "Laboratory testing and diagnostics", products: 0, status: "Unknown" },
    { id: "", name: "Supplements", description: "Nutritional supplements and vitamins", products: 0, status: "Unknown" },
    { id: "", name: "Mental Health", description: "Mental health and wellness services", products: 0, status: "Unknown" },
    { id: "", name: "Women's Health", description: "Women's healthcare services", products: 0, status: "Unknown" },
]

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
    } else if (status === "Active") {
        className = "bg-green-100 text-green-800 border border-green-200";
    } else if (status === "Draft") {
        className = "bg-gray-100 text-gray-800 border border-gray-200";
    }
    return <Badge className={className}>{status}</Badge>;
};

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [activeProductStatus, setActiveProductStatus] = React.useState("All Status");
  const [activeCategoryStatus, setActiveCategoryStatus] = React.useState("All Status");
  const [activeCategoryFilter, setActiveCategoryFilter] = React.useState("All");

  const productCategories = ["All", "Hair", "Mental Health", "Prescriptions", "Supplements", "Telehealth", "Women's Health"];
  const productStatuses = ["All Status", "Active", "Draft"];
  const categoryFilters = ["All", "Hair", "Mental Health", "Prescriptions", "Supplements", "Telehealth", "Women's Health"];
  const categoryStatuses = ["All Status", "Active", "Draft"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products &amp; Subscriptions</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
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
                    {productCategories.map((category) => (
                        <FilterButton
                        key={category}
                        label={category}
                        isActive={activeCategory === category}
                        onClick={() => setActiveCategory(category)}
                        />
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    {productStatuses.map((status) => (
                        <FilterButton
                        key={status}
                        label={status}
                        isActive={activeProductStatus === status}
                        onClick={() => setActiveProductStatus(status)}
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
            </CardContent>
            <CardFooter>
                 <div className="text-sm text-muted-foreground">
                    {mockProducts.length} products found
                 </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="relative w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search categories..." className="pl-9" />
                </div>
                 <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add New Category
                </Button>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                    {categoryFilters.map((category) => (
                        <FilterButton
                        key={category}
                        label={category}
                        isActive={activeCategoryFilter === category}
                        onClick={() => setActiveCategoryFilter(category)}
                        />
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    {categoryStatuses.map((status) => (
                        <FilterButton
                        key={status}
                        label={status}
                        isActive={activeCategoryStatus === status}
                        onClick={() => setActiveCategoryStatus(status)}
                        />
                    ))}
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCategories.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>{category.id}</TableCell>
                      <TableCell>{category.products}</TableCell>
                      <TableCell>
                        <StatusBadge status={category.status} />
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
            </CardContent>
            <CardFooter>
                <div className="text-sm text-muted-foreground">
                    {mockCategories.length} categories found
                </div>
            </CardFooter>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
