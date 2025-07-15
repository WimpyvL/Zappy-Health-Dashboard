
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
import { ProductFormModal } from "./components/product-form-modal";
import { useToast } from "@/hooks/use-toast";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
    authDomain: "zappy-health-c1kob.firebaseapp.com",
    databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
    projectId: "zappy-health-c1kob",
    storageBucket: "zappy-health-c1kob.appspot.com",
    messagingSenderId: "833435237612",
    appId: "1:833435237612:web:53731373b2ad7568f279c9"
  };
  
  // Initialize Firebase
  let app;
  try {
    app = initializeApp(firebaseConfig, "products-app");
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }
  const db = getFirestore(app);

type Product = {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    status: string;
    isActive: boolean;
};

type Category = {
    id: string;
    name: string;
    description: string;
    products: number;
    status: string;
};

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

const StatusBadge = ({ status, isActive }: { status: string; isActive?: boolean }) => {
    const finalStatus = status === 'Unknown' ? (isActive ? 'Active' : 'Draft') : status;
    let className = "bg-gray-100 text-gray-800 border border-gray-200";
    if (finalStatus === "Active") {
        className = "bg-green-100 text-green-800 border border-green-200";
    } else if (finalStatus === "Draft") {
        className = "bg-gray-100 text-gray-800 border border-gray-200";
    }
    return <Badge className={`${className} hover:${className}`}>{finalStatus}</Badge>;
};

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [activeProductStatus, setActiveProductStatus] = React.useState("All Status");
  const [activeCategoryStatus, setActiveCategoryStatus] = React.useState("All Status");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(query(productsCollection, orderBy("name", "asc")));
        const productList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productList);

        const categoriesCollection = collection(db, "categories");
        const categoriesSnapshot = await getDocs(query(categoriesCollection, orderBy("name", "asc")));
        const categoryList = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), products: 0 } as Category));
        setCategories(categoryList);

    } catch (error) {
        console.error("Error fetching data: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not retrieve data from the database." });
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (editingProduct) {
        // @ts-ignore
        const productDoc = doc(db, "products", editingProduct.id);
        await updateDoc(productDoc, values);
        toast({ title: "Product Updated", description: `${values.name} has been saved.` });
      } else {
        await addDoc(collection(db, "products"), { ...values, createdAt: Timestamp.now() });
        toast({ title: "Product Added", description: `${values.name} has been created.` });
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving product: ", error);
      toast({ variant: "destructive", title: "Error Saving Product" });
    }
  };


  const productCategories = ["All", "Hair", "Mental Health", "Prescriptions", "Supplements", "Telehealth", "Women's Health"];
  const productStatuses = ["All Status", "Active", "Draft"];
  const categoryFilters = ["All", "Hair", "Mental Health", "Prescriptions", "Supplements", "Telehealth", "Women's Health"];
  const categoryStatuses = ["All Status", "Active", "Draft"];

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products &amp; Subscriptions</h1>
        <Button onClick={handleOpenAddModal}>
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
                  {loading ? (
                    Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                      </TableRow>
                    ))
                  ) : products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} isActive={product.isActive}/>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(product)}>
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
                    {products.length} products found
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
                  {loading ? (
                    Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                      </TableRow>
                    ))
                  ) : categories.map((category) => (
                    <TableRow key={category.id}>
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
                    {categories.length} categories found
                </div>
            </CardFooter>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
    <ProductFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
        onSubmit={handleFormSubmit}
    />
    </>
  );
}
