
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, Zap, Search } from 'lucide-react';
import PageHeader from '@/components/ui/redesign/PageHeader';
import Container from '@/components/ui/redesign/Container';
import { Input } from '@/components/ui/input';

const mockCategories = [
  { name: 'Weight Management', color: 'blue' },
  { name: 'Hair Loss', color: 'purple' },
  { name: 'Sexual Health', color: 'pink' },
  { name: 'Skin Care', color: 'teal' },
  { name: 'Mental Health', color: 'green' },
  { name: 'General Health', color: 'gray' },
];

const mockProducts = [
  {
    id: 1,
    category: 'Weight Management',
    name: 'GLP-1 Rx Program',
    description: 'Our most popular program for sustainable weight loss.',
    price: '$99/month',
    color: 'blue',
  },
  {
    id: 2,
    category: 'Hair Loss',
    name: 'Hair Recovery Program',
    description: 'Clinically-proven treatment for hair regrowth.',
    price: '$49/month',
    color: 'purple',
  },
   {
    id: 3,
    category: 'Sexual Health',
    name: 'ED Treatment Plan',
    description: 'Discreet and effective treatment for erectile dysfunction.',
    price: '$2/pill',
    color: 'pink',
  }
];

const ShopPage = () => {
  return (
    <Container maxWidth="5xl">
      <PageHeader
        title="Explore Services"
        subtitle="Find the right treatment plan to achieve your health goals."
      />

      <div className="mb-8">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search for treatments or conditions..." className="pl-10 text-base py-6 rounded-lg"/>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
            {mockCategories.map(cat => (
                <Button key={cat.name} variant="outline" className={`border-${cat.color}-200 text-${cat.color}-700 hover:bg-${cat.color}-50`}>
                    {cat.name}
                </Button>
            ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <CardHeader className={`bg-${product.color}-100 p-6`}>
              <Badge variant="secondary" className={`mb-2 bg-white text-${product.color}-700`}>{product.category}</Badge>
              <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
              <p className="text-muted-foreground pt-1">{product.description}</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-3xl font-bold">
                {product.price}
              </div>
              <Button className="w-full bg-${product.color}-600 hover:bg-${product.color}-700">
                <Zap className="w-4 h-4 mr-2" /> Start My Visit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
};

export default ShopPage;
