import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'service_order' | 'client';
  id: string;
  title: string;
  details?: Array<{ label: string; value: string }>;
}

export function QRCodeModal({
  isOpen,
  onClose,
  type,
  id,
  title,
  details = []
}: QRCodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Gerar QR Code</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          <QRCodeGenerator
            type={type}
            id={id}
            title={title}
            details={details}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 