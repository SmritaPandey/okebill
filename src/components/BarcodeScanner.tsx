import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Scan, Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const simulateScan = () => {
    // Simulate barcode detection for demo purposes
    const mockBarcodes = [
      "1234567890123",
      "9876543210987",
      "5555555555555",
      "1111111111111"
    ];
    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];

    toast({
      title: "Barcode Detected",
      description: `Scanned: ${randomBarcode}`,
    });

    onScan(randomBarcode);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Barcode Scanner</span>
          </DialogTitle>
          <DialogDescription>
            Point your camera at a barcode to scan it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={startCamera} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg object-cover"
              />

              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-emerald-500 w-48 h-32 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500"></div>

                  {/* Scanning line animation */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 animate-pulse"></div>
                </div>
              </div>

              {isScanning && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                    Scanning...
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={simulateScan} className="flex-1" disabled={!isScanning}>
              <Scan className="h-4 w-4 mr-2" />
              Simulate Scan
            </Button>
            <Button onClick={handleClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Position the barcode within the frame and it will be detected automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
