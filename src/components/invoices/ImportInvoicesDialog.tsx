import React, { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    X,
    Loader2,
    Download,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ImportResult {
    success: boolean;
    summary: {
        totalRows: number;
        validRows: number;
        invoicesCreated: number;
        clientsCreated: number;
        errors: string[];
    };
}

interface ImportInvoicesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportInvoicesDialog({ isOpen, onClose }: ImportInvoicesDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const importMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE}/invoices/import`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Import failed');
            }
            return response.json() as Promise<ImportResult>;
        },
        onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({
                title: 'Import Complete',
                description: `Created ${data.summary.invoicesCreated} invoices and ${data.summary.clientsCreated} new clients`,
            });
        },
        onError: (err: Error) => {
            toast({ title: 'Import Failed', description: err.message, variant: 'destructive' });
        },
    });

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && isValidFile(file)) {
            setSelectedFile(file);
            setResult(null);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && isValidFile(file)) {
            setSelectedFile(file);
            setResult(null);
        }
    };

    const isValidFile = (file: File) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
            toast({ title: 'Invalid file', description: 'Please upload an Excel (.xlsx, .xls) or CSV file', variant: 'destructive' });
            return false;
        }
        return true;
    };

    const handleImport = () => {
        if (selectedFile) importMutation.mutate(selectedFile);
    };

    const handleClose = () => {
        setSelectedFile(null);
        setResult(null);
        setIsDragOver(false);
        onClose();
    };

    const handleDownloadTemplate = () => {
        const csvContent = 'Client Name,Client Email,Description,Quantity,Unit Price,Tax %,Due Date,Notes\n'
            + 'Acme Corp,acme@corp.com,Web Design,1,5000,18,2026-03-01,\n'
            + 'Acme Corp,acme@corp.com,Hosting (12 months),12,100,18,2026-03-01,Monthly hosting\n'
            + 'Beta Inc,beta@inc.com,Consulting,10,200,10,2026-04-01,\n';

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice_import_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        Import Invoices from Excel
                    </DialogTitle>
                    <DialogDescription>
                        Upload a spreadsheet with your bills. Clients and invoices will be created automatically.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-4">
                        {/* Drop zone */}
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragOver
                                ? 'border-blue-500 bg-blue-50'
                                : selectedFile
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {selectedFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileSpreadsheet className="h-10 w-10 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-900">
                                        Drop your Excel file here, or click to browse
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Supports .xlsx, .xls, and .csv files (max 10MB)
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Expected format */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Expected Columns</p>
                            <div className="flex flex-wrap gap-1.5">
                                {['Client Name', 'Client Email', 'Description', 'Quantity', 'Unit Price', 'Tax %', 'Due Date', 'Notes'].map(col => (
                                    <Badge key={col} variant="secondary" className="text-xs">{col}</Badge>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Rows with the same <strong>Client Name + Due Date</strong> are grouped into one invoice.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-2">
                            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="h-4 w-4 mr-1" />
                                Download Template
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={!selectedFile || importMutation.isPending}
                                >
                                    {importMutation.isPending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
                                    ) : (
                                        <><Upload className="h-4 w-4 mr-2" />Import</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Results View */
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-green-900">Import Successful!</p>
                                <p className="text-sm text-green-700 mt-1">
                                    Processed {result.summary.totalRows} rows from your spreadsheet.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-blue-700">{result.summary.invoicesCreated}</p>
                                <p className="text-xs text-blue-600">Invoices Created</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-emerald-700">{result.summary.clientsCreated}</p>
                                <p className="text-xs text-emerald-600">New Clients</p>
                            </div>
                        </div>

                        {result.summary.errors.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <p className="text-sm font-medium text-amber-800">{result.summary.errors.length} warning(s)</p>
                                </div>
                                <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                                    {result.summary.errors.map((err, i) => (
                                        <li key={i}>• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleClose}>Done</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
