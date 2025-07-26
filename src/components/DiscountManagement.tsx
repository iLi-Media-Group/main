import React, { useState, useEffect } from 'react';
import { Percent, Plus, Edit, Trash2, Calendar, Tag, Save, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Discount {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  applies_to: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DiscountFormData {
  name: string;
  description: string;
  discount_percent: number;
  applies_to: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  discount_type: 'automatic' | 'promotion_code';
  promotion_code: string;
}

const APPLICABLE_ITEMS = [
  { value: 'all', label: 'All Products & Plans' },
  // White Label Plans
  { value: 'starter', label: 'White Label Starter Plan' },
  { value: 'pro', label: 'White Label Pro Plan' },
  { value: 'enterprise', label: 'White Label Enterprise Plan' },
  // White Label Features
  { value: 'producer_applications', label: 'Producer Applications' },
  { value: 'ai_recommendations', label: 'AI Recommendations' },
  { value: 'deep_media_search', label: 'Deep Media Search' },
  // Individual Track Licenses
  { value: 'single_track', label: 'Single Track License' },
  // Access Plans
  { value: 'gold_access', label: 'Gold Access Plan' },
  { value: 'platinum_access', label: 'Platinum Access Plan' },
  { value: 'ultimate_access', label: 'Ultimate Access Plan' }
];

// Mapping of product names to Stripe price IDs for discount application
const PRODUCT_PRICE_MAPPING = {
  'single_track': 'price_1RdAeZR8RYA8TFzwVH3MHECa',
  'gold_access': 'price_1RdAfER8RYA8TFzw7RrrNmtt',
  'platinum_access': 'price_1RdAfXR8RYA8TFzwFZyaSREP',
  'ultimate_access': 'price_1RdAfqR8RYA8TFzwKP7zrKsm',
  'starter': 'white_label_starter', // Custom pricing handled in white-label-checkout
  'pro': 'white_label_pro', // Custom pricing handled in white-label-checkout
  'enterprise': 'white_label_enterprise', // Custom pricing handled in white-label-checkout
  'producer_applications': 'white_label_feature', // Custom pricing handled in white-label-checkout
  'ai_recommendations': 'white_label_feature', // Custom pricing handled in white-label-checkout
  'deep_media_search': 'white_label_feature' // Custom pricing handled in white-label-checkout
};

export function DiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<string | null>(null);

  const [formData, setFormData] = useState<DiscountFormData>({
    name: '',
    description: '',
    discount_percent: 0,
    applies_to: [],
    start_date: '',
    end_date: '',
    is_active: true,
    discount_type: 'automatic',
    promotion_code: ''
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDiscounts(data || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.discount_percent <= 0 || formData.applies_to.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (editingDiscount) {
        // Update existing discount
        const { error } = await supabase
          .from('discounts')
          .update({
            name: formData.name,
            description: formData.description,
            discount_percent: formData.discount_percent,
            applies_to: formData.applies_to,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active,
            discount_type: formData.discount_type,
            promotion_code: formData.discount_type === 'promotion_code' ? formData.promotion_code : null
          })
          .eq('id', editingDiscount.id);

        if (error) throw error;
        setSuccess('Discount updated successfully');
      } else {
        // Create new discount
        const { error } = await supabase
          .from('discounts')
          .insert({
            name: formData.name,
            description: formData.description,
            discount_percent: formData.discount_percent,
            applies_to: formData.applies_to,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active,
            discount_type: formData.discount_type,
            promotion_code: formData.discount_type === 'promotion_code' ? formData.promotion_code : null
          });

        if (error) throw error;
        setSuccess('Discount created successfully');
      }

      // Reset form and refresh data
      resetForm();
      fetchDiscounts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error saving discount:', err);
      setError('Failed to save discount');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description || '',
      discount_percent: discount.discount_percent,
      applies_to: discount.applies_to,
      start_date: discount.start_date,
      end_date: discount.end_date,
      is_active: discount.is_active,
      discount_type: (discount as any).discount_type || 'automatic',
      promotion_code: (discount as any).promotion_code || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (discountId: string) => {
    try {
      setDeletingDiscount(discountId);
      setError(null);

      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      setSuccess('Discount deleted successfully');
      fetchDiscounts();
      
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error deleting discount:', err);
      setError('Failed to delete discount');
    } finally {
      setDeletingDiscount(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percent: 0,
      applies_to: [],
      start_date: '',
      end_date: '',
      is_active: true,
      discount_type: 'automatic',
      promotion_code: ''
    });
    setEditingDiscount(null);
    setShowForm(false);
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const startDate = new Date(discount.start_date);
    const endDate = new Date(discount.end_date);

    if (!discount.is_active) {
      return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Inactive</span>;
    }

    if (now < startDate) {
      return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Upcoming</span>;
    }

    if (now > endDate) {
      return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Expired</span>;
    }

    return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>;
  };

  const getApplicableItemsText = (appliesTo: string[]) => {
    if (appliesTo.includes('all')) {
      return 'All Products & Plans';
    }
    return appliesTo.map(item => 
      APPLICABLE_ITEMS.find(option => option.value === item)?.label || item
    ).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Discount Management</h2>
          <p className="text-gray-400">Manage discounts for White Label plans and features</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Discount</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* Discount Form */}
      {showForm && (
        <div className="bg-blue-900 p-6 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20"
                  placeholder="e.g., Spring Sale, Black Friday"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
                    className="block w-full px-3 py-2 pr-8 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="10"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="block w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20"
                rows={3}
                placeholder="Optional description of the discount..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Type *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="discount_type"
                      value="automatic"
                      checked={formData.discount_type === 'automatic'}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value as 'automatic' | 'promotion_code' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Automatic Discount (applies to all eligible purchases)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="discount_type"
                      value="promotion_code"
                      checked={formData.discount_type === 'promotion_code'}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value as 'automatic' | 'promotion_code' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Promotion Code (requires customers to enter code)</span>
                  </label>
                </div>
              </div>

              {formData.discount_type === 'promotion_code' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Promotion Code *
                  </label>
                  <input
                    type="text"
                    value={formData.promotion_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, promotion_code: e.target.value.toUpperCase() }))}
                    className="block w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-500/20"
                    placeholder="e.g., WELCOME10, SUMMER20"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Applies To *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {APPLICABLE_ITEMS.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center space-x-2 text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.applies_to.includes(item.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            applies_to: [...prev.applies_to, item.value]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            applies_to: prev.applies_to.filter(val => val !== item.value)
                          }));
                        }
                      }}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="block w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:border-blue-500 focus:ring focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="block w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:border-blue-500 focus:ring focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">Active</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{editingDiscount ? 'Update Discount' : 'Create Discount'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discounts List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Active Discounts</h3>
        
        {discounts.length === 0 ? (
          <div className="text-center py-12 bg-blue-900 rounded-xl border border-blue-500/20">
            <Percent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Discounts</h3>
            <p className="text-gray-400">Create your first discount to start offering special pricing</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="bg-blue-900 rounded-xl border border-blue-500/20 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{discount.name}</h4>
                      {getStatusBadge(discount)}
                    </div>
                    {discount.description && (
                      <p className="text-gray-400 text-sm mb-3">{discount.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-blue-400 font-semibold">{discount.discount_percent}% off</span>
                      <span className="text-gray-300">
                        {new Date(discount.start_date).toLocaleDateString()} - {new Date(discount.end_date).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        (discount as any).discount_type === 'promotion_code' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {(discount as any).discount_type === 'promotion_code' ? 'Promotion Code' : 'Automatic'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(discount)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      disabled={deletingDiscount === discount.id}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingDiscount === discount.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Applies to:</span>
                  </div>
                  <p className="text-sm text-gray-400">{getApplicableItemsText(discount.applies_to)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 