import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { proposalsApi, clientsApi, settingsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, FileText, PenTool, Calendar, IndianRupee, Building, User } from 'lucide-react';

interface ProposalData {
    id: string;
    title: string;
    description: string | null;
    service_type: string | null;
    amount: number;
    tax_rate: number;
    valid_until: string | null;
    status: string;
    client_id: string;
    user_id: string;
}

interface ClientData {
    name: string;
    email: string;
}

interface CompanyData {
    name: string;
    address: string | null;
    logo_url: string | null;
    primary_color: string | null;
}

const ProposalPublicView = () => {
    const { proposalId } = useParams<{ proposalId: string }>();
    const [proposal, setProposal] = useState<ProposalData | null>(null);
    const [client, setClient] = useState<ClientData | null>(null);
    const [company, setCompany] = useState<CompanyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigning, setIsSigning] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const fetchProposal = async () => {
            if (!proposalId) return;

            try {
                // Fetch proposal via public endpoint
                const proposalData = await proposalsApi.getPublic(Number(proposalId));
                const mapped = {
                    id: String(proposalData.id),
                    title: proposalData.title,
                    description: (proposalData as any).notes || null,
                    service_type: null,
                    amount: proposalData.total || 0,
                    tax_rate: 0,
                    valid_until: proposalData.validUntil || null,
                    status: proposalData.status,
                    client_id: String(proposalData.clientId),
                    user_id: String(proposalData.userId),
                };
                setProposal(mapped);
                setIsAccepted(mapped.status === 'accepted');

                // Fetch client
                try {
                    const clientData = await clientsApi.get(Number(mapped.client_id));
                    setClient({ name: clientData.name, email: clientData.contactEmail });
                } catch { /* public view may not have client access */ }

                // Fetch company settings
                try {
                    const settings = await settingsApi.get();
                    setCompany({
                        name: settings.companyName || '',
                        address: settings.companyAddress || null,
                        logo_url: null,
                        primary_color: null,
                    });
                } catch { /* ignore */ }
            } catch (error) {
                console.error('Error fetching proposal:', error);
                toast.error('Failed to load proposal');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposal();
    }, [proposalId]);

    // Canvas drawing handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureData(canvas.toDataURL('image/png'));
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData(null);
    };

    const handleAccept = async () => {
        if (!proposal || !signatureData) return;

        setIsSigning(true);
        try {
            await proposalsApi.updateStatus(Number(proposal.id), 'accepted');

            setIsAccepted(true);
            toast.success('Proposal accepted! We will be in touch soon.');
        } catch (error) {
            console.error('Error accepting proposal:', error);
            toast.error('Failed to accept proposal. Please try again.');
        } finally {
            setIsSigning(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const primaryColor = company?.primary_color || '#1E3A5F';
    const taxAmount = proposal ? (proposal.amount * proposal.tax_rate) / 100 : 0;
    const totalAmount = proposal ? proposal.amount + taxAmount : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!proposal) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full mx-4">
                    <CardContent className="pt-6 text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Proposal Not Found</h2>
                        <p className="text-gray-500">The proposal you're looking for doesn't exist or has been removed.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    {company?.logo_url && (
                        <img src={company.logo_url} alt={company.name} className="h-12 mx-auto mb-4" />
                    )}
                    <h1 className="text-3xl font-bold text-gray-900">{company?.name || 'Business Proposal'}</h1>
                    {company?.address && <p className="text-gray-500 mt-1">{company.address}</p>}
                </div>

                {/* Status Banner */}
                {isAccepted && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-800">Proposal Accepted</p>
                            <p className="text-sm text-green-600">Thank you for accepting this proposal.</p>
                        </div>
                    </div>
                )}

                {/* Proposal Card */}
                <Card className="mb-6 shadow-lg">
                    <CardHeader style={{ borderBottom: `3px solid ${primaryColor}` }}>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" style={{ color: primaryColor }} />
                            {proposal.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Client Info */}
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Prepared for</p>
                                <p className="font-semibold">{client?.name}</p>
                                <p className="text-sm text-gray-500">{client?.email}</p>
                            </div>
                        </div>

                        {/* Description */}
                        {proposal.description && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
                            </div>
                        )}

                        {/* Service Type */}
                        {proposal.service_type && (
                            <div className="flex items-center gap-3">
                                <Building className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Service Type</p>
                                    <p className="font-medium">{proposal.service_type}</p>
                                </div>
                            </div>
                        )}

                        {/* Valid Until */}
                        {proposal.valid_until && (
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Valid Until</p>
                                    <p className="font-medium">{formatDate(proposal.valid_until)}</p>
                                </div>
                            </div>
                        )}

                        {/* Pricing */}
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(proposal.amount)}</span>
                            </div>
                            {proposal.tax_rate > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>GST ({proposal.tax_rate}%)</span>
                                    <span>{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-2 border-t" style={{ color: primaryColor }}>
                                <span className="flex items-center gap-1">
                                    <IndianRupee className="h-5 w-5" />
                                    Total
                                </span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Signature Section */}
                {!isAccepted && proposal.status !== 'rejected' && proposal.status !== 'expired' && (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PenTool className="h-5 w-5" style={{ color: primaryColor }} />
                                Accept Proposal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                By signing below, you accept the terms of this proposal and authorize us to proceed with the work.
                            </p>

                            {/* Signature Canvas */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                                <canvas
                                    ref={canvasRef}
                                    width={500}
                                    height={150}
                                    className="w-full cursor-crosshair touch-none"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                            </div>
                            <p className="text-sm text-gray-400 text-center">Draw your signature above</p>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={clearSignature} className="flex-1">
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleAccept}
                                    disabled={!signatureData || isSigning}
                                    className="flex-1"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {isSigning ? 'Processing...' : 'Accept & Sign'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-8">
                    Powered by <span className="font-semibold">OkBill</span>
                </p>
            </div>
        </div>
    );
};

export default ProposalPublicView;
