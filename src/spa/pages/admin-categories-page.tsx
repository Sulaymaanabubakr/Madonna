import { useEffect, useState } from "react";
import { Save, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchAdminCategories, saveAdminCategory, deleteAdminCategory } from "@/lib/firestore-admin";
import type { Category } from "@/types";

export function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>({ name: "", slug: "", description: "" });

    const loadCategories = async () => {
        setLoading(true);
        const data = await fetchAdminCategories();
        setCategories(data);
        setLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleGenerateSlug = () => {
        if (!formData.name) return;
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const success = await saveAdminCategory(formData);
        if (success) {
            toast.success(editingId ? "Category updated" : "Category created");
            setFormData({ name: "", slug: "", description: "" });
            setEditingId(null);
            loadCategories();
        } else {
            toast.error("Failed to save category");
        }
        setSaving(false);
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setFormData({ name: category.name, slug: category.slug, description: category.description, id: category.id });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ name: "", slug: "", description: "" });
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) return;
        const success = await deleteAdminCategory(id);
        if (success) {
            toast.success("Category deleted");
            loadCategories();
            if (editingId === id) handleCancelEdit();
        } else {
            toast.error("Failed to delete category");
        }
    };

    return (
        <div className="space-y-6 pt-4 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <p className="text-muted-foreground mt-2">Manage product categories to organize your store.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Form Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>{editingId ? "Edit Category" : "New Category"}</CardTitle>
                        <CardDescription>{editingId ? "Update existing category details." : "Create a new category."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name *</label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} onBlur={handleGenerateSlug} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug *</label>
                                <Input required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea className="min-h-[100px]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="submit" disabled={saving} className="flex-1">
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? "Saving..." : "Save Category"}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* List Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Existing Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto w-full">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b">
                                    <tr className="font-medium text-muted-foreground [&>th]:p-4">
                                        <th>Category Name</th>
                                        <th>Slug</th>
                                        <th className="w-[100px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Loading categories...</td></tr>
                                    ) : categories.length === 0 ? (
                                        <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No categories defined yet.</td></tr>
                                    ) : (
                                        categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-4 font-medium">{category.name}</td>
                                                <td className="p-4 text-muted-foreground">{category.slug}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id, category.name)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
