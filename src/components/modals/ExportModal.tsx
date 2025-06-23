import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { FileText, FileSpreadsheet, Download, Settings, Calendar, Clock } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  isExporting?: boolean;
  availableReports: Array<{
    id: string;
    name: string;
    description: string;
    data?: any;
  }>;
  selectedDate?: Date;
}

export interface ExportConfig {
  format: 'pdf' | 'excel';
  reports: string[];
  filename?: string;
  includeCharts: boolean;
  consolidate: boolean;
  customOptions: {
    title?: string;
    subtitle?: string;
    includeCompanyInfo: boolean;
    includeGeneratedDate: boolean;
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting = false,
  availableReports,
  selectedDate = new Date()
}) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'pdf',
    reports: [],
    filename: '',
    includeCharts: true,
    consolidate: false,
    customOptions: {
      title: '',
      subtitle: '',
      includeCompanyInfo: true,
      includeGeneratedDate: true
    }
  });

  const handleReportToggle = (reportId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      reports: checked 
        ? [...prev.reports, reportId]
        : prev.reports.filter(id => id !== reportId)
    }));
  };

  const handleSelectAll = () => {
    const allSelected = config.reports.length === availableReports.length;
    setConfig(prev => ({
      ...prev,
      reports: allSelected ? [] : availableReports.map(r => r.id)
    }));
  };

  const generateDefaultFilename = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const reportCount = config.reports.length;
    
    if (config.consolidate && reportCount > 1) {
      return `relatorios-consolidados-${dateStr}`;
    }
    
    if (reportCount === 1) {
      const report = availableReports.find(r => r.id === config.reports[0]);
      return `${report?.id}-${dateStr}`;
    }
    
    return `relatorios-${dateStr}`;
  };

  const handleExport = () => {
    const finalConfig = {
      ...config,
      filename: config.filename || generateDefaultFilename()
    };
    
    onExport(finalConfig);
  };

  const getEstimatedSize = () => {
    const baseSize = config.reports.length * 0.5;
    const chartMultiplier = config.includeCharts ? 1.3 : 1;
    return (baseSize * chartMultiplier).toFixed(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Exportar Relatórios</span>
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para os relatórios selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Relatórios para Exportar</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {config.reports.length === availableReports.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {availableReports.map((report) => (
                <div key={report.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={report.id}
                    checked={config.reports.includes(report.id)}
                    onCheckedChange={(checked) => handleReportToggle(report.id, checked as boolean)}
                  />
                  <Label htmlFor={report.id} className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-xs text-muted-foreground">{report.description}</div>
                    </div>
                  </Label>
                  {report.data && (
                    <Badge variant="secondary" className="text-xs">
                      Dados disponíveis
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {config.reports.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {config.reports.length} relatório(s) selecionado(s)
              </div>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium mb-3 block">Formato de Exportação</Label>
            <RadioGroup
              value={config.format}
              onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as 'pdf' | 'excel' }))}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">PDF</div>
                    <div className="text-xs text-muted-foreground">Ideal para impressão</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center space-x-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Excel</div>
                    <div className="text-xs text-muted-foreground">Ideal para análises</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium mb-3 block">Nome do Arquivo</Label>
            <Input
              placeholder={`${generateDefaultFilename()}.${config.format}`}
              value={config.filename}
              onChange={(e) => setConfig(prev => ({ ...prev, filename: e.target.value }))}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Deixe em branco para gerar automaticamente
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Resumo da Exportação</span>
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex items-center space-x-2">
                {config.format === 'pdf' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                <span>Formato: {config.format.toUpperCase()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>{config.reports.length} relatório(s) selecionado(s)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Data: {format(selectedDate, 'dd/MM/yyyy', { locale: pt })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Tamanho estimado: ~{getEstimatedSize()} MB</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={config.reports.length === 0 || isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exportando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 