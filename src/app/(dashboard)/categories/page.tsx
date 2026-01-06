'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  Plus, MoreVertical, Pencil, Trash2, FolderOpen,
  ShoppingBag, UtensilsCrossed, Car, Home, Heart, Plane,
  Gamepad2, GraduationCap, Gift, Briefcase, TrendingUp, Receipt,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  type: 'expense' | 'income' | 'both'
  icon: string
  color: string
  is_default: boolean
  is_active: boolean
}

const iconOptions = [
  { name: 'ShoppingBag', Icon: ShoppingBag },
  { name: 'UtensilsCrossed', Icon: UtensilsCrossed },
  { name: 'Car', Icon: Car },
  { name: 'Home', Icon: Home },
  { name: 'Heart', Icon: Heart },
  { name: 'Plane', Icon: Plane },
  { name: 'Gamepad2', Icon: Gamepad2 },
  { name: 'GraduationCap', Icon: GraduationCap },
  { name: 'Gift', Icon: Gift },
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'TrendingUp', Icon: TrendingUp },
  { name: 'Receipt', Icon: Receipt },
]

const colors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('expense')
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<'expense' | 'income' | 'both'>('expense')
  const [icon, setIcon] = useState('ShoppingBag')
  const [color, setColor] = useState(colors[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name')

    if (data) setCategories(data)
    setIsLoading(false)
  }

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: 'Error', description: 'Please enter a category name', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const categoryData = {
        user_id: session.user.id,
        name,
        type,
        icon,
        color,
        is_default: false,
        is_active: true,
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name, type, icon, color } as any)
          .eq('id', editingCategory.id)

        if (error) throw error
        toast({ title: 'Category updated' })
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData as any)

        if (error) throw error
        toast({ title: 'Category created' })
      }

      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deletingId)

    if (error) {
      toast({ title: 'Error', description: 'Category may be in use. Try deactivating instead.', variant: 'destructive' })
    } else {
      toast({ title: 'Category deleted' })
      fetchCategories()
    }

    setDeleteDialogOpen(false)
    setDeletingId(null)
  }

  const resetForm = () => {
    setName('')
    setType('expense')
    setIcon('ShoppingBag')
    setColor(colors[0])
    setEditingCategory(null)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setType(category.type)
    setIcon(category.icon)
    setColor(category.color)
    setDialogOpen(true)
  }

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find(i => i.name === iconName)
    return found ? found.Icon : ShoppingBag
  }

  const filteredCategories = categories.filter(c =>
    activeTab === 'expense' ? (c.type === 'expense' || c.type === 'both') :
    activeTab === 'income' ? (c.type === 'income' || c.type === 'both') : true
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize your transactions with custom categories
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No categories yet</p>
                <p className="text-muted-foreground mb-4">Create your first category</p>
                <Button onClick={() => { resetForm(); setType(activeTab as 'expense' | 'income'); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon)

                return (
                  <Card key={category.id} className={cn('card-hover', !category.is_active && 'opacity-60')}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {category.type === 'both' ? 'Expense & Income' : category.type}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(category)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!category.is_default && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { setDeletingId(category.id); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category details' : 'Create a new category for your transactions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Groceries"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'expense' | 'income' | 'both')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map(({ name: iconName, Icon }) => (
                  <button
                    key={iconName}
                    type="button"
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center transition-all border',
                      icon === iconName
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setIcon(iconName)}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-full transition-all',
                      color === c && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} loading={isSubmitting}>
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Transactions using this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
