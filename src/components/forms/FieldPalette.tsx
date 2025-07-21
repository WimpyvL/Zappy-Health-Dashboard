/**
 * @fileoverview Field Palette component for drag-and-drop form building
 * Based on the enhanced form system from Zappy-Dashboard
 */

'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  ChevronDown,
  CheckSquare,
  Radio,
  Upload,
  Palette,
  Eye,
  Minus,
  Header,
  FileText,
  Star,
  Grid3X3,
  PenTool
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { FieldType } from '@/types/formTypes';

interface FieldTypeConfig {
  type: FieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'basic' | 'advanced' | 'layout' | 'medical';
  isNew?: boolean;
  isPro?: boolean;
}

const FIELD_TYPES: FieldTypeConfig[] = [
  // Basic Fields
  {
    type: 'text',
    label: 'Text Input',
    description: 'Single line text input',
    icon: <Type className="w-4 h-4" />,
    category: 'basic'
  },
  {
    type: 'textarea',
    label: 'Text Area',
    description: 'Multi-line text input',
    icon: <AlignLeft className="w-4 h-4" />,
    category: 'basic'
  },
  {
    type: 'email',
    label: 'Email',
    description: 'Email address input',
    icon: <Mail className="w-4 h-4" />,
    category: 'basic'
  },
  {
    type: 'tel',
    label: 'Phone',
    description: 'Phone number input',
    icon: <Phone className="w-4 h-4" />,
    category: 'basic'
  },
  {
    type: 'number',
    label: 'Number',
    description: 'Numeric input',
    icon: <Hash className="w-4 h-4" />,
    category: 'basic'
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Date picker',
    icon: <Calendar className="w-4 h-4" />,
    category: 'basic'
  },
  {
    type: 'time',
    label: 'Time',
    description: 'Time picker',
    icon: <Clock className="w-4 h-4" />,
    category: 'basic'
  },

  // Advanced Fields
  {
    type: 'select',
    label: 'Dropdown',
    description: 'Single selection dropdown',
    icon: <ChevronDown className="w-4 h-4" />,
    category: 'advanced'
  },
  {
    type: 'multiselect',
    label: 'Multi-Select',
    description: 'Multiple selection dropdown',
    icon: <CheckSquare className="w-4 h-4" />,
    category: 'advanced'
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    description: 'Single choice from options',
    icon: <Radio className="w-4 h-4" />,
    category: 'advanced'
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    description: 'Multiple choice from options',
    icon: <CheckSquare className="w-4 h-4" />,
    category: 'advanced'
  },
  {
    type: 'file',
    label: 'File Upload',
    description: 'File upload input',
    icon: <Upload className="w-4 h-4" />,
    category: 'advanced'
  },
  {
    type: 'range',
    label: 'Range Slider',
    description: 'Numeric range slider',
    icon: <Minus className="w-4 h-4" />,
    category: 'advanced'
  },
  {
    type: 'color',
    label: 'Color Picker',
    description: 'Color selection input',
    icon: <Palette className="w-4 h-4" />,
    category: 'advanced'
  },
  {
    type: 'rating',
    label: 'Rating',
    description: 'Star rating input',
    icon: <Star className="w-4 h-4" />,
    category: 'advanced',
    isNew: true
  },
  {
    type: 'matrix',
    label: 'Matrix/Grid',
    description: 'Grid of questions',
    icon: <Grid3X3 className="w-4 h-4" />,
    category: 'advanced',
    isPro: true
  },
  {
    type: 'signature',
    label: 'Digital Signature',
    description: 'Signature capture',
    icon: <PenTool className="w-4 h-4" />,
    category: 'advanced',
    isPro: true
  },

  // Layout Fields
  {
    type: 'section-header',
    label: 'Section Header',
    description: 'Section title and description',
    icon: <Header className="w-4 h-4" />,
    category: 'layout'
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visual separator line',
    icon: <Minus className="w-4 h-4" />,
    category: 'layout'
  },
  {
    type: 'html-content',
    label: 'HTML Content',
    description: 'Custom HTML content',
    icon: <FileText className="w-4 h-4" />,
    category: 'layout'
  },

  // Medical Fields (specialized)
  {
    type: 'text',
    label: 'Medical ID',
    description: 'SSN, NPI, DEA numbers',
    icon: <Type className="w-4 h-4" />,
    category: 'medical'
  }
];

interface DraggableFieldProps {
  fieldType: FieldTypeConfig;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ fieldType }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `palette-${fieldType.type}`,
    data: {
      type: 'palette-field',
      fieldType: fieldType.type,
      label: fieldType.label,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <CardContent className="p-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-gray-100 group-hover:bg-blue-100 rounded-md transition-colors">
              {fieldType.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {fieldType.label}
                </h4>
                {fieldType.isNew && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    New
                  </Badge>
                )}
                {fieldType.isPro && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                    Pro
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {fieldType.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface FieldCategoryProps {
  title: string;
  description: string;
  fields: FieldTypeConfig[];
  icon: React.ReactNode;
  defaultOpen?: boolean;
}

const FieldCategory: React.FC<FieldCategoryProps> = ({
  title,
  description,
  fields,
  icon,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-gray-100 rounded-md">
              {icon}
            </div>
            <div>
              <div className="font-medium text-sm">{title}</div>
              <div className="text-xs text-gray-500">{description}</div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-2">
          {fields.map((field) => (
            <DraggableField key={field.type} fieldType={field} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const FieldPalette: React.FC = () => {
  const categories = [
    {
      title: 'Basic Fields',
      description: 'Essential form inputs',
      icon: <Type className="w-4 h-4" />,
      fields: FIELD_TYPES.filter(f => f.category === 'basic'),
      defaultOpen: true
    },
    {
      title: 'Advanced Fields',
      description: 'Complex input types',
      icon: <CheckSquare className="w-4 h-4" />,
      fields: FIELD_TYPES.filter(f => f.category === 'advanced'),
      defaultOpen: false
    },
    {
      title: 'Layout Elements',
      description: 'Structure and design',
      icon: <AlignLeft className="w-4 h-4" />,
      fields: FIELD_TYPES.filter(f => f.category === 'layout'),
      defaultOpen: false
    },
    {
      title: 'Medical Fields',
      description: 'Healthcare-specific inputs',
      icon: <FileText className="w-4 h-4" />,
      fields: FIELD_TYPES.filter(f => f.category === 'medical'),
      defaultOpen: false
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-1">Build Your Form</h3>
        <p className="text-sm text-blue-700">
          Drag fields from here to the canvas to build your form
        </p>
      </div>

      {categories.map((category) => (
        <Card key={category.title} className="border-gray-200">
          <FieldCategory
            title={category.title}
            description={category.description}
            icon={category.icon}
            fields={category.fields}
            defaultOpen={category.defaultOpen}
          />
        </Card>
      ))}

      {/* Quick Actions */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Browse Templates
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Upload className="w-4 h-4 mr-2" />
            Import Form
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldPalette;