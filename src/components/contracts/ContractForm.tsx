import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ContractFormData } from '@/hooks/useContracts';
import { ClientFormData } from '../clients/ClientForm';

interface ContractFormProps {
    clients: ClientFormData[];
    initialData?: ContractFormData;
    onSubmit: (data: ContractFormData) => void;
    onCancel: () => void;
}

const ContractForm: React.FC<ContractFormProps> = ({
    clients,
    initialData,
    onSubmit,
    onCancel,
}) => {
    const [clientId, setClientId] = useState(initialData?.clientId || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(initialData?.endDate || '');
    const [status, setStatus] = useState<'draft' | 'active' | 'completed' | 'cancelled'>(
        initialData?.status || 'draft'
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setClientId(initialData.clientId);
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setAmount(initialData.amount);
            setStartDate(initialData.startDate);
            setEndDate(initialData.endDate || '');
            setStatus(initialData.status);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !title) return;

        setIsSubmitting(true);
        onSubmit({
            id: initialData?.id,
            clientId,
            title,
            description,
            amount,
            startDate,
            endDate,
            status,
        });
        setIsSubmitting(false);
    };

    const isEditMode = !!initialData?.id;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="client">Client *</Label>
                <Select value={clientId} onValueChange={setClientId} disabled={isEditMode}>
                    <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id || ''}>
                                {client.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contract title"
                    className="mt-1"
                    required
                />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contract description..."
                    className="mt-1"
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1"
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1"
                    />
                </div>
            </div>

            {/* Recurring Billing Section */}
            <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-3 text-gray-700">Recurring Billing</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="billingFrequency">Billing Frequency</Label>
                        <Select value="monthly" onValueChange={() => { }}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">One-time</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="nextBillingDate">Next Billing Date</Label>
                        <Input
                            id="nextBillingDate"
                            type="date"
                            value={startDate}
                            className="mt-1"
                            disabled
                        />
                        <p className="text-xs text-gray-400 mt-1">Auto-calculated based on frequency</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !clientId || !title}>
                    {isSubmitting
                        ? isEditMode ? 'Updating...' : 'Creating...'
                        : isEditMode ? 'Update Contract' : 'Create Contract'}
                </Button>
            </div>
        </form>
    );
};

export default ContractForm;
