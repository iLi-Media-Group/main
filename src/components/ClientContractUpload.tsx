import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface ClientContractUploadProps {
  syncProposalId?: string;
  customSyncRequestId?: string;
  contractType: 'sync_proposal' | 'custom_sync_request';
  onContractUploaded?: (contractId: string) => void;
  onContractSigned?: () => void;
}

interface ContractData {
  id: string;
  original_contract_url: string;
  original_contract_filename: string;
  uploaded_at: string;
  signed_contract_url?: string;
  signed_contract_filename?: string;
  signed_at?: string;
  signed_by?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  email_sent: boolean;
  notes?: string;
}

export function ClientContractUpload({ 
  syncProposalId, 
  customSyncRequestId, 
  contractType,
  onContractUploaded,
  onContractSigned 
}: ClientContractUploadProps) {
  const { user } = useUnifiedAuth();
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContractData();
  }, [syncProposalId, customSyncRequestId]);

  const fetchContractData = async () => {
    if (!syncProposalId && !customSyncRequestId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_contracts')
        .select(`
          id,
          original_contract_url,
          original_contract_filename,
          uploaded_at,
          signed_contract_url,
          signed_contract_filename,
          signed_at,
          email_sent,
          notes,
          signed_by:profiles!client_contracts_signed_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq(contractType === 'sync_proposal' ? 'sync_proposal_id' : 'custom_sync_request_id', 
            syncProposalId || customSyncRequestId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      setContractData(data);
    } catch (err) {
      console.error('Error fetching contract data:', err);
      setError('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setContractFile(file);
    setError('');
  };

  const handleUpload = async () => {
    if (!contractFile || !user) return;

    try {
      setUploading(true);
      setError('');

      // Upload file to Supabase Storage
      const fileName = `client-contracts/${Date.now()}-${contractFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, contractFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      // Create contract record
      const { data: contractRecord, error: contractError } = await supabase
        .rpc('handle_client_contract_upload', {
          p_sync_proposal_id: syncProposalId || null,
          p_custom_sync_request_id: customSyncRequestId || null,
          p_contract_url: publicUrl,
          p_contract_filename: contractFile.name,
          p_uploaded_by: user.id
        });

      if (contractError) throw contractError;

      // Send notification email
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-contract-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contractId: contractRecord,
            contractType: contractType
          })
        });
      } catch (emailError) {
        console.error('Failed to send contract notification email:', emailError);
        // Don't fail the upload if email fails
      }

      setSuccess('Contract uploaded successfully!');
      setContractFile(null);
      
      if (onContractUploaded) {
        onContractUploaded(contractRecord);
      }

      // Refresh contract data
      await fetchContractData();

      // Reset file input
      const fileInput = document.getElementById('contract-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Error uploading contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload contract');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignContract = async () => {
    if (!contractData || !user) return;

    try {
      setUploading(true);
      setError('');

      // For now, we'll simulate signing by updating the record
      // In a real implementation, this would integrate with an e-signature service
      const { error } = await supabase
        .rpc('handle_client_contract_signing', {
          p_contract_id: contractData.id,
          p_signed_contract_url: contractData.original_contract_url, // For now, use original as signed
          p_signed_contract_filename: `SIGNED_${contractData.original_contract_filename}`,
          p_signed_by: user.id
        });

      if (error) throw error;

      setSuccess('Contract signed successfully!');
      
      if (onContractSigned) {
        onContractSigned();
      }

      // Refresh contract data
      await fetchContractData();

    } catch (err) {
      console.error('Error signing contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign contract');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-blue-800/50 border border-blue-600/30 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-blue-200">Loading contract data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-400">{success}</span>
          </div>
        </div>
      )}

      {!contractData ? (
        <div className="p-6 bg-blue-800/50 border border-blue-600/30 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Client Contract</h3>
          <p className="text-blue-200 mb-4">
            Please upload your contract PDF. The producer/artist will need to sign this contract before files are made available.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contract PDF
              </label>
              <input
                id="contract-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
            </div>

            {contractFile && (
              <div className="flex items-center justify-between p-3 bg-blue-900/50 border border-blue-600/30 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-blue-200">{contractFile.name}</span>
                </div>
                <button
                  onClick={() => setContractFile(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!contractFile || uploading}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Contract
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-blue-800/50 border border-blue-600/30 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Contract Status</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-900/50 border border-blue-600/30 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-400 mr-2" />
                <div>
                  <p className="text-blue-200 font-medium">{contractData.original_contract_filename}</p>
                  <p className="text-blue-300 text-sm">Uploaded {new Date(contractData.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(contractData.original_contract_url, contractData.original_contract_filename)}
                className="text-blue-400 hover:text-blue-300"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {contractData.signed_contract_url ? (
              <div className="flex items-center justify-between p-3 bg-green-900/50 border border-green-600/30 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <div>
                    <p className="text-green-200 font-medium">Contract Signed</p>
                    <p className="text-green-300 text-sm">
                      Signed by {contractData.signed_by?.first_name} {contractData.signed_by?.last_name} on {new Date(contractData.signed_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(contractData.signed_contract_url!, contractData.signed_contract_filename!)}
                  className="text-green-400 hover:text-green-300"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-yellow-900/50 border border-yellow-600/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-200">Contract pending signature</span>
                  </div>
                  <button
                    onClick={handleSignContract}
                    disabled={uploading}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Signing...' : 'Sign Contract'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
