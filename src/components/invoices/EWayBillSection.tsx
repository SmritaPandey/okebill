import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EWayBillData {
  eWayBillNumber: string;
  transportMode: 'road' | 'rail' | 'air' | 'ship' | '';
  vehicleNumber: string;
  transporterName: string;
  transporterGstin: string;
  distanceKm: number;
}

interface EWayBillSectionProps {
  data: EWayBillData;
  onChange: (data: EWayBillData) => void;
  invoiceTotal: number;
}

const EWayBillSection: React.FC<EWayBillSectionProps> = ({ data, onChange, invoiceTotal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRequired = invoiceTotal >= 50000;
  const isPartiallyFilled = !!(data.eWayBillNumber || data.vehicleNumber || data.transporterName);
  const isComplete = !!(data.eWayBillNumber && data.transportMode && data.vehicleNumber);

  const updateField = <K extends keyof EWayBillData>(field: K, value: EWayBillData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${
      isRequired && !isComplete
        ? 'border-amber-300 bg-amber-50/30'
        : isComplete
          ? 'border-green-200 bg-green-50/30'
          : 'border-gray-200'
    }`}>
      {/* Header */}
      <Button
        type="button"
        variant="ghost"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 rounded-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">E-Way Bill Details</span>
          {isRequired && !isComplete && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs gap-1">
              <AlertTriangle className="w-3 h-3" />
              Required (₹50,000+)
            </Badge>
          )}
          {isComplete && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {data.eWayBillNumber || 'Filled'}
            </Badge>
          )}
          {!isRequired && !isPartiallyFilled && (
            <span className="text-xs text-muted-foreground">(Optional)</span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 space-y-4 border-t">
          {isRequired && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              ⚠️ E-Way Bill is mandatory for goods transportation when invoice value is ₹50,000 or above.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">E-Way Bill Number</Label>
              <Input
                placeholder="e.g. 1234 5678 9012"
                value={data.eWayBillNumber}
                onChange={(e) => updateField('eWayBillNumber', e.target.value)}
                className="font-mono text-sm"
                maxLength={15}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transport Mode *</Label>
              <Select
                value={data.transportMode}
                onValueChange={(val) => updateField('transportMode', val as EWayBillData['transportMode'])}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="road">🚛 Road</SelectItem>
                  <SelectItem value="rail">🚂 Rail</SelectItem>
                  <SelectItem value="air">✈️ Air</SelectItem>
                  <SelectItem value="ship">🚢 Ship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Vehicle Number</Label>
              <Input
                placeholder="e.g. MH12AB1234"
                value={data.vehicleNumber}
                onChange={(e) => updateField('vehicleNumber', e.target.value.toUpperCase())}
                className="font-mono text-sm uppercase"
                maxLength={12}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Distance (KM)</Label>
              <Input
                type="number"
                placeholder="e.g. 250"
                min={0}
                value={data.distanceKm || ''}
                onChange={(e) => updateField('distanceKm', parseInt(e.target.value) || 0)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Transporter Name</Label>
              <Input
                placeholder="e.g. Blue Dart Express"
                value={data.transporterName}
                onChange={(e) => updateField('transporterName', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transporter GSTIN</Label>
              <Input
                placeholder="e.g. 27AABCU9603R1ZM"
                value={data.transporterGstin}
                onChange={(e) => updateField('transporterGstin', e.target.value.toUpperCase())}
                className="font-mono text-sm uppercase"
                maxLength={15}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EWayBillSection;
