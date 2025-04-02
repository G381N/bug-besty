"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { vulnerabilityTypes } from '@/constants/vulnerabilityTypes';
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Vulnerability {
  _id: string;
  type: string;
  severity: string;
  status: 'Not Yet Done' | 'Found' | 'Not Found';
  notes?: string;
  subdomainId: string;
}

interface Subdomain {
  _id: string;
  name: string;
  status: string;
  projectId: string;
}

interface ScreenshotModalProps {
  url: string;
  onClose: () => void;
  domain: string;
}

function ScreenshotModal({ url, onClose, domain }: ScreenshotModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageError = () => {
    setError('Failed to load screenshot');
    setIsLoading(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-background border border-white/10 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Screenshot of {domain}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetry}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-primary"
              title="Refresh Screenshot"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[calc(90vh-100px)] overflow-auto">
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-black/50">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
                <p>{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <Image 
                key={retryCount} // Force reload on retry
                src={`${url}&t=${retryCount}`}
                alt={`Screenshot of ${domain}`}
                fill
                className="object-contain"
                priority
                quality={100}
                onLoadingComplete={() => setIsLoading(false)}
                onError={handleImageError}
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const StatusBadge = ({ status, onStatusChange, badgeId, openStatusId, setOpenStatusId }: { 
  status: 'Not Yet Done' | 'Found' | 'Not Found';
  onStatusChange: (newStatus: 'Not Yet Done' | 'Found' | 'Not Found') => void;
  badgeId: string;
  openStatusId: string | null;
  setOpenStatusId: (id: string | null) => void;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Found': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Not Found': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpenStatusId(openStatusId === badgeId ? null : badgeId)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 
          ${getStatusColor(status)} hover:bg-opacity-20`}
      >
        {status}
      </button>
      
      {openStatusId === badgeId && (
        <div className="absolute right-0 mt-2 w-40 bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg z-50">
          {['Not Yet Done', 'Found', 'Not Found'].map((option) => (
            <button
              key={option}
              onClick={() => {
                onStatusChange(option as 'Not Yet Done' | 'Found' | 'Not Found');
                setOpenStatusId(null);
              }}
              className={`w-full px-4 py-2 text-left text-sm first:rounded-t-lg last:rounded-b-lg
                ${status === option ? getStatusColor(option) : 'hover:bg-white/10'}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Add debounce utility at the top of the file
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function SubdomainDetails() {
  const router = useRouter();
  const params = useParams();
  const subdomainId = params.subdomainId as string;
  
  const [subdomain, setSubdomain] = useState<Subdomain | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Not Yet Done' | 'Found' | 'Not Found'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [unsavedNotes, setUnsavedNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [selectedVulns, setSelectedVulns] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAddVulnForm, setShowAddVulnForm] = useState(false);
  const [newVulnData, setNewVulnData] = useState({
    type: '',
    severity: 'High'
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Create debounced save function
  const debouncedSave = useCallback(
    debounce(async (vulnId: string, notes: string) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/vulnerabilities/${vulnId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });

        if (response.ok) {
          const updatedVuln = await response.json();
          setVulnerabilities(prevVulns =>
            prevVulns.map(vuln =>
              vuln._id === vulnId ? { ...vuln, notes: updatedVuln.notes } : vuln
            )
          );
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 2000);
        } else {
          throw new Error('Failed to save notes');
        }
      } catch (error) {
        console.error('Error saving notes:', error);
        setSaveStatus('unsaved');
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subdomain data
        const subResponse = await fetch(`/api/subdomains/${subdomainId}`);
        const subData = await subResponse.json();
        setSubdomain(subData);

        // Fetch vulnerabilities
        const vulnResponse = await fetch(`/api/subdomains/${subdomainId}/vulnerabilities`);
        const vulnData = await vulnResponse.json();
        setVulnerabilities(vulnData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [subdomainId]);

  useEffect(() => {
    if (selectedVuln) {
      setUnsavedNotes(selectedVuln.notes || '');
    }
  }, [selectedVuln]);

  const filteredVulnerabilities = vulnerabilities
    .filter(vuln => filterSeverity === 'All' || vuln.severity === filterSeverity)
    .filter(vuln => filterStatus === 'All' || vuln.status === filterStatus)
    .filter(vuln => vuln.type.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleStatusChange = async (vulnId: string, newStatus: 'Not Yet Done' | 'Found' | 'Not Found') => {
    try {
      const response = await fetch(`/api/vulnerabilities/${vulnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setVulnerabilities(prevVulns =>
          prevVulns.map(vuln =>
            vuln._id === vulnId ? { ...vuln, status: newStatus } : vuln
          )
        );
      }
    } catch (error) {
      console.error('Error updating vulnerability:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedVuln) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch(`/api/vulnerabilities/${selectedVuln._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: unsavedNotes }),
      });

      if (response.ok) {
        const updatedVuln = await response.json();
        setVulnerabilities(prevVulns =>
          prevVulns.map(vuln =>
            vuln._id === selectedVuln._id ? { ...vuln, notes: updatedVuln.notes } : vuln
          )
        );
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        throw new Error('Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  };

  const getScreenshotUrl = (domain: string) => {
    const fullUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    
    return `https://api.screenshotmachine.com?key=1b31bc&url=${encodeURIComponent(fullUrl)}&dimension=1024x768`;
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedVulns(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedVulns.size === filteredVulnerabilities.length) {
      setSelectedVulns(new Set());
    } else {
      setSelectedVulns(new Set(filteredVulnerabilities.map(vuln => vuln._id)));
    }
  };

  const toggleVulnSelection = (vulnId: string) => {
    const newSelected = new Set(selectedVulns);
    if (newSelected.has(vulnId)) {
      newSelected.delete(vulnId);
    } else {
      newSelected.add(vulnId);
    }
    setSelectedVulns(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedVulns.size} selected vulnerabilities?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/subdomains/${subdomainId}/vulnerabilities/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vulnerabilityIds: Array.from(selectedVulns)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete vulnerabilities');
      }

      setVulnerabilities(prevVulns =>
        prevVulns.filter(vuln => !selectedVulns.has(vuln._id))
      );
      setSelectedVulns(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error deleting vulnerabilities:', error);
      alert('Failed to delete vulnerabilities');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddVulnerability = async () => {
    try {
      const response = await fetch(`/api/subdomains/${subdomainId}/vulnerabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newVulnData,
          status: 'Not Yet Done'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add vulnerability');
      }

      const newVuln = await response.json();
      setVulnerabilities(prev => [newVuln, ...prev]);
      setShowAddVulnForm(false);
      setNewVulnData({ type: '', severity: 'High' });
    } catch (error) {
      console.error('Error adding vulnerability:', error);
      alert('Failed to add vulnerability');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b border-white/10 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center px-3 py-2 text-sm text-foreground/70 hover:text-foreground 
                  bg-background/50 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Project
              </button>
              <h1 className="text-xl font-semibold text-primary">
                {subdomain?.name}
              </h1>
            </div>

            {/* Search and Camera Button */}
            <div className="flex items-center space-x-3">
              {/* Add Vulnerability Button */}
              <button
                onClick={() => setShowAddVulnForm(true)}
                className="p-2 bg-background border border-white/10 rounded-lg 
                  hover:border-primary/50 hover:text-primary transition-all duration-200
                  group relative"
                title="Add Vulnerability"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                  whitespace-nowrap text-xs bg-background/95 px-2 py-1 rounded 
                  border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  Add Vulnerability
                </span>
              </button>

              {/* Camera Button */}
              <button
                className="p-2 bg-background border border-white/10 rounded-lg 
                  hover:border-primary/50 hover:text-primary transition-all duration-200
                  group relative"
                onClick={() => setShowScreenshot(true)}
                title="Take Screenshot"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                  whitespace-nowrap text-xs bg-background/95 px-2 py-1 rounded 
                  border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  Take Screenshot
                </span>
              </button>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 bg-background border border-white/10 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                    text-sm placeholder-foreground/40 text-foreground"
                />
                <svg
                  className="absolute right-3 top-2.5 w-4 h-4 text-foreground/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="px-4 py-2 bg-background border border-white/10 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                  text-foreground appearance-none cursor-pointer
                  bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')] 
                  bg-[length:12px_8px] bg-[right_16px_center] bg-no-repeat pr-12"
              >
                <option value="All" className="bg-background text-foreground">All Severities</option>
                <option value="High" className="bg-background text-foreground">High</option>
                <option value="Medium" className="bg-background text-foreground">Medium</option>
                <option value="Low" className="bg-background text-foreground">Low</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-background border border-white/10 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                  text-foreground appearance-none cursor-pointer
                  bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')] 
                  bg-[length:12px_8px] bg-[right_16px_center] bg-no-repeat pr-12"
              >
                <option value="All" className="bg-background text-foreground">All Statuses</option>
                <option value="Not Yet Done" className="bg-background text-foreground">Not Yet Done</option>
                <option value="Found" className="bg-background text-foreground">Found</option>
                <option value="Not Found" className="bg-background text-foreground">Not Found</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Vulnerabilities List */}
        <div className="w-1/2 border-r border-white/10 overflow-y-auto">
          {/* Selection Controls */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-end gap-6 px-6 py-4">
              {isSelectionMode ? (
                <div className="flex items-center gap-6">
                  <button
                    onClick={toggleSelectAll}
                    className="text-[15px] font-medium text-foreground/70 hover:text-foreground 
                      transition-all duration-200"
                  >
                    {selectedVulns.size === filteredVulnerabilities.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedVulns.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      className="text-[15px] font-medium text-red-400 hover:text-red-300 
                        transition-all duration-200 flex items-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        `Delete (${selectedVulns.size})`
                      )}
                    </button>
                  )}
                  <button
                    onClick={toggleSelectionMode}
                    className="text-[15px] font-medium text-foreground/70 hover:text-foreground 
                      transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleSelectionMode}
                  className="text-[15px] font-medium text-foreground/70 hover:text-foreground 
                    transition-all duration-200"
                >
                  Select
                </button>
              )}
            </div>
          </div>

          {/* Vulnerabilities List */}
          <div className="px-6 py-2 space-y-3">
            {filteredVulnerabilities.map((vuln) => (
              <div
                key={vuln._id}
                onClick={() => isSelectionMode ? toggleVulnSelection(vuln._id) : setSelectedVuln(vuln)}
                className={`p-4 rounded-xl flex items-center justify-between 
                  transition-all duration-200 cursor-pointer
                  ${isSelectionMode && selectedVulns.has(vuln._id)
                    ? 'bg-primary/10 border border-primary/20' 
                    : selectedVuln?._id === vuln._id && !isSelectionMode
                    ? 'bg-white/5 border border-white/10' 
                    : vuln.severity === 'High'
                    ? 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20'
                    : vuln.severity === 'Medium'
                    ? 'bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-green-500/5 hover:bg-green-500/10 border border-green-500/20'
                  }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {isSelectionMode && (
                    <div
                      className={`w-5 h-5 rounded-lg transition-all duration-200 flex items-center justify-center
                        ${selectedVulns.has(vuln._id)
                          ? 'bg-primary scale-100'
                          : 'border-2 border-white/10 hover:border-white/20'
                        }`}
                    >
                      {selectedVulns.has(vuln._id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      vuln.severity === 'High'
                        ? 'text-red-400'
                        : vuln.severity === 'Medium'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}>
                      {vuln.type}
                    </h3>
                  </div>
                </div>
                
                <StatusBadge 
                  status={vuln.status} 
                  onStatusChange={(newStatus) => handleStatusChange(vuln._id, newStatus)}
                  badgeId={vuln._id}
                  openStatusId={openStatusId}
                  setOpenStatusId={setOpenStatusId}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Notes */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-6">
            {selectedVuln ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground/90">{selectedVuln.type}</h2>
                    <div 
                    className={`px-3 py-1.5 rounded-lg border ${
                        selectedVuln.severity === 'High' 
                          ? 'text-red-500 border-red-500/20 bg-red-500/10' 
                          : selectedVuln.severity === 'Medium'
                          ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10'
                          : 'text-green-500 border-green-500/20 bg-green-500/10'
                      }`}
                    >
                    <span className="font-medium text-sm">{selectedVuln.severity}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground/90">Notes</h3>
                    <div className="flex items-center space-x-2">
                      {isSaving && (
                        <span className="text-primary/70 text-sm flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          Saving...
                        </span>
                      )}
                      {saveStatus === 'saved' && (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Saved
                        </span>
                      )}
                      {saveStatus === 'unsaved' && (
                        <span className="text-red-500 text-sm">Failed to save</span>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={unsavedNotes}
                    onChange={(e) => {
                      const newNotes = e.target.value;
                      setUnsavedNotes(newNotes);
                      if (selectedVuln) {
                        debouncedSave(selectedVuln._id, newNotes);
                      }
                    }}
                    placeholder="Add your notes here..."
                    className="w-full h-[calc(100vh-280px)] bg-black/20 border border-white/10 rounded-lg p-4 
                      text-foreground placeholder-foreground/40
                      focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30
                      transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[calc(100vh-200px)] text-foreground/40">
                Select a vulnerability to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {showScreenshot && subdomain && (
        <ScreenshotModal
          url={getScreenshotUrl(subdomain.name)}
          domain={subdomain.name}
          onClose={() => setShowScreenshot(false)}
        />
      )}

      {showAddVulnForm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddVulnForm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-black/40 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4
              shadow-2xl backdrop-blur-sm"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-6 text-orange-500">
              Add Vulnerability
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddVulnerability();
            }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/70">Vulnerability Name</label>
                <input
                  type="text"
                  value={newVulnData.type}
                  onChange={(e) => setNewVulnData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg
                    text-foreground placeholder-foreground/30
                    focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30
                    transition-all duration-200"
                  placeholder="Enter vulnerability name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/70">Severity</label>
                <select
                  value={newVulnData.severity}
                  onChange={(e) => setNewVulnData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg
                    text-foreground appearance-none cursor-pointer
                    focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30
                    transition-all duration-200"
                  required
                >
                  <option value="High" className="bg-background">High</option>
                  <option value="Medium" className="bg-background">Medium</option>
                  <option value="Low" className="bg-background">Low</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary/90 hover:bg-primary text-white rounded-lg
                    transition-all duration-200 font-medium
                    shadow-[0_0_0_1px_rgba(255,165,0,0.2)] hover:shadow-[0_0_0_2px_rgba(255,165,0,0.3)]"
                >
                  Add Vulnerability
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVulnForm(false)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-foreground rounded-lg
                    transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
} 