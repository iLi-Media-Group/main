import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Clock, Download, FileText, Music, Calendar, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface FileReleaseItem {
  id: string;
  type: 'custom_sync' | 'sync_proposal';
  title: string;
  client_name: string;
  payment_status: string;
  payment_terms: string;
  payment_due_date?: string;
  files_released: boolean;
  files_released_at?: string;
  amount: number;
  created_at: string;
  // Custom sync specific
  project_title?: string;
  sync_fee?: number;
  // Sync proposal specific
  track_title?: string;
  sync_fee_amount?: number;
}

export function ProducerFileReleaseManager() {
  const { user } = useAuth();
  const [fileReleases, setFileReleases] = useState<FileReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FileReleaseItem | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFileReleases();
    }
  }, [user]);

  const fetchFileReleases = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch custom sync requests where this producer is selected
      const { data: customSyncData, error: customSyncError } = await supabase
        .from('custom_sync_requests')
        .select(`
          id,
          project_title,
          sync_fee,
          payment_status,
          payment_terms,
          payment_due_date,
          files_released,
          files_released_at,
          created_at,
          client:profiles!custom_sync_requests_client_id_fkey(first_name, last_name)
        `)
        .eq('selected_producer_id', user.id)
        .order('created_at', { ascending: false });

      if (customSyncError) throw customSyncError;

      // Fetch sync proposals for this producer
      const { data: syncProposalData, error: syncProposalError } = await supabase
        .from('sync_proposals')
        .select(`
          id,
          track_title,
          sync_fee_amount,
          payment_status,
          payment_terms,
          payment_due_date,
          created_at,
          client:profiles!sync_proposals_client_id_fkey(first_name, last_name),
          file_release:sync_proposal_file_releases!sync_proposal_file_releases_sync_proposal_id_fkey(
            files_released,
            files_released_at
          )
        `)
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });

      if (syncProposalError) throw syncProposalError;

      // Combine and format the data
      const customSyncItems: FileReleaseItem[] = (customSyncData || []).map(item => ({
        id: item.id,
        type: 'custom_sync' as const,
        title: item.project_title,
        client_name: `${item.client?.first_name || ''} ${item.client?.last_name || ''}`.trim() || 'Unknown Client',
        payment_status: item.payment_status,
        payment_terms: item.payment_terms,
        payment_due_date: item.payment_due_date,
        files_released: item.files_released,
        files_released_at: item.files_released_at,
        amount: item.sync_fee,
        created_at: item.created_at,
        project_title: item.project_title,
        sync_fee: item.sync_fee
      }));

      const syncProposalItems: FileReleaseItem[] = (syncProposalData || []).map(item => ({
        id: item.id,
        type: 'sync_proposal' as const,
        title: item.track_title,
        client_name: `${item.client?.first_name || ''} ${item.client?.last_name || ''}`.trim() || 'Unknown Client',
        payment_status: item.payment_status,
        payment_terms: item.payment_terms,
        payment_due_date: item.payment_due_date,
        files_released: item.file_release?.files_released || false,
        files_released_at: item.file_release?.files_released_at,
        amount: item.sync_fee_amount,
        created_at: item.created_at,
        track_title: item.track_title,
        sync_fee_amount: item.sync_fee_amount
      }));

      setFileReleases([...customSyncItems, ...syncProposalItems]);
    } catch (err) {
      console.error('Error fetching file releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch file releases');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFiles = async (item: FileReleaseItem) => {
    setSelectedItem(item);
    setConfirmDialogOpen(true);
  };

  const confirmReleaseFiles = async () => {
    if (!selectedItem) return;

    try {
      setReleasing(true);

      if (selectedItem.type === 'custom_sync') {
        // Update custom sync request
        const { error } = await supabase
          .from('custom_sync_requests')
          .update({
            files_released: true,
            files_released_at: new Date().toISOString(),
            files_released_by: user.id
          })
          .eq('id', selectedItem.id);

        if (error) throw error;
      } else {
        // Update sync proposal file release
        const { error } = await supabase
          .from('sync_proposal_file_releases')
          .upsert({
            sync_proposal_id: selectedItem.id,
            producer_id: user.id,
            files_released: true,
            files_released_at: new Date().toISOString(),
            files_released_by: user.id,
            payment_terms: selectedItem.payment_terms,
            payment_due_date: selectedItem.payment_due_date
          });

        if (error) throw error;
      }

      // Refresh the list
      await fetchFileReleases();
      setConfirmDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error releasing files:', err);
      setError(err instanceof Error ? err.message : 'Failed to release files');
    } finally {
      setReleasing(false);
    }
  };

  const getStatusBadge = (item: FileReleaseItem) => {
    if (item.payment_status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    
    if (item.files_released) {
      return <Badge className="bg-blue-100 text-blue-800">Files Released</Badge>;
    }

    if (item.payment_terms === 'immediate') {
      return <Badge className="bg-red-100 text-red-800">Payment Required</Badge>;
    }

    if (item.payment_due_date) {
      const dueDate = new Date(item.payment_due_date);
      const now = new Date();
      
      if (dueDate <= now) {
        return <Badge className="bg-orange-100 text-orange-800">Payment Due</Badge>;
      } else {
        return <Badge className="bg-yellow-100 text-yellow-800">Payment Pending</Badge>;
      }
    }

    return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
  };

  const canReleaseFiles = (item: FileReleaseItem) => {
    // Can't release if already released
    if (item.files_released) return false;
    
    // Can release if payment is complete
    if (item.payment_status === 'paid') return true;
    
    // Can release for net terms (business decision)
    if (item.payment_terms !== 'immediate') return true;
    
    return false;
  };

  const getPaymentDueInfo = (item: FileReleaseItem) => {
    if (!item.payment_due_date) return null;
    
    const dueDate = new Date(item.payment_due_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue > 0) {
      return `Due in ${daysUntilDue} days`;
    } else if (daysUntilDue === 0) {
      return 'Due today';
    } else {
      return `Overdue by ${Math.abs(daysUntilDue)} days`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading file releases...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">File Release Manager</h2>
        <Button onClick={fetchFileReleases} variant="outline">
          Refresh
        </Button>
      </div>

      {fileReleases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No File Releases</h3>
            <p className="text-gray-500">
              You don't have any pending file releases. Files will appear here when clients select your submissions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fileReleases.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {item.type === 'custom_sync' ? (
                        <Music className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-purple-500" />
                      )}
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      {getStatusBadge(item)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Client:</span> {item.client_name}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ${item.amount}
                      </div>
                      <div>
                        <span className="font-medium">Payment Terms:</span> {item.payment_terms.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {item.payment_due_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{getPaymentDueInfo(item)}</span>
                      </div>
                    )}

                    {item.files_released && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                        <CheckCircle className="w-4 h-4" />
                        <span>Files released on {new Date(item.files_released_at!).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {canReleaseFiles(item) && (
                      <Button
                        onClick={() => handleReleaseFiles(item)}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Release Files
                      </Button>
                    )}
                    
                    {item.files_released && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Released
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm File Release</DialogTitle>
            <DialogDescription>
              Are you sure you want to release the files for "{selectedItem?.title}"? 
              This will make the files available for download by the client.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Files will be immediately available for download</li>
                  <li>This action cannot be undone</li>
                  <li>Payment may still be pending depending on terms</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={releasing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReleaseFiles}
              disabled={releasing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {releasing ? 'Releasing...' : 'Confirm Release'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
