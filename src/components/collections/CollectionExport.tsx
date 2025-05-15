// src/components/collections/CollectionExport.jsx
import React, { useState } from 'react';
import { 
  FileText, FileJson, Table, Map, Check, Download, 
  Printer, QrCode, Share2, Copy, X, Settings 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

// Required external libraries (install these):
// npm install jspdf papaparse file-saver qrcode

const CollectionExport = ({ 
  isOpen, 
  onClose, 
  collection, 
  plaques = [] 
}) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportStatus, setExportStatus] = useState('idle'); // idle, loading, success, error
  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeDescription: true,
    includeInscriptions: true,
    includeVisitStatus: true,
    includeCoordinates: true,
    includeTimestamps: false,
    includeNotes: true,
    pageSize: 'a4',
    colorMode: 'color',
    mapType: 'markers', // markers, heatmap, route
    routeOptimization: 'none', // none, distance, custom
    fileFormat: 'json', // For JSON: json, geojson
    delimiter: ',', // For CSV: comma, semicolon, tab
    coordinateFormat: 'decimal', // decimal, dms
  });
  
  // Handle export options change
  const handleOptionChange = (key, value) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Generate QR code for collection sharing
  const generateQR = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      
      // In a real app, this would be a URL to your collection
      const url = `https://plaquer.app/collections/${collection.id}`;
      
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      // Create link to download QR code
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${sanitizeFilename(collection.name)}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code generated successfully');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };
  
  // Export collection to PDF
  const exportToPDF = async () => {
    try {
      setExportStatus('loading');
      
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Create a new PDF document
      const orientation = exportOptions.pageSize === 'a4' ? 'portrait' : 'landscape';
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: exportOptions.pageSize
      });
      
      // Add title
      doc.setFontSize(18);
      doc.text(collection.name, 20, 20);
      
      // Add collection info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      if (collection.description && exportOptions.includeDescription) {
        doc.text(`Description: ${collection.description}`, 20, 30);
      }
      
      // Add plaques count
      doc.text(`Contains ${plaques.length} plaques`, 20, 40);
      
      // Add creation date if timestamps included
      if (exportOptions.includeTimestamps && collection.created_at) {
        const created = new Date(collection.created_at).toLocaleDateString();
        doc.text(`Created: ${created}`, 20, 45);
      }
      
      // Add plaques
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Plaques:', 20, 55);
      
      let yPosition = 65;
      plaques.forEach((plaque, index) => {
        // Check if we need a new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add plaque information
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${plaque.title}`, 20, yPosition);
        yPosition += 7;
        
        // Add location
        if (plaque.location) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(`Location: ${plaque.location}`, 25, yPosition);
          yPosition += 5;
        }
        
        // Add coordinates if enabled
        if (exportOptions.includeCoordinates && plaque.latitude && plaque.longitude) {
          doc.text(`Coordinates: ${plaque.latitude}, ${plaque.longitude}`, 25, yPosition);
          yPosition += 5;
        }
        
        // Add inscription if enabled
        if (exportOptions.includeInscriptions && plaque.inscription) {
          doc.text(`Inscription: ${plaque.inscription}`, 25, yPosition);
          yPosition += 5;
        }
        
        // Add visit status if enabled
        if (exportOptions.includeVisitStatus) {
          doc.text(`Visited: ${plaque.visited ? 'Yes' : 'No'}`, 25, yPosition);
          yPosition += 10;
        }
      });
      
      // Save the PDF
      const filename = `${sanitizeFilename(collection.name)}.pdf`;
      doc.save(filename);
      
      setExportStatus('success');
      toast.success(`Collection exported to PDF successfully`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setExportStatus('error');
      toast.error('Failed to export collection to PDF');
    }
  };
  
  // Export collection to CSV
  const exportToCSV = async () => {
    try {
      setExportStatus('loading');
      
      // Dynamic import of PapaParse
      const Papa = (await import('papaparse')).default;
      
      // Determine fields to include
      const fields = ['id', 'title', 'location', 'color', 'profession'];
      
      if (exportOptions.includeInscriptions) fields.push('inscription');
      if (exportOptions.includeVisitStatus) fields.push('visited');
      if (exportOptions.includeCoordinates) {
        fields.push('latitude');
        fields.push('longitude');
      }
      if (exportOptions.includeNotes) fields.push('notes');
      
      // Prepare data
      const csvData = plaques.map(plaque => {
        const row = {};
        fields.forEach(field => {
          if (field in plaque) {
            row[field] = plaque[field];
          } else {
            row[field] = '';
          }
        });
        return row;
      });
      
      // Determine delimiter
      let delimiter = ',';
      if (exportOptions.delimiter === 'semicolon') delimiter = ';';
      if (exportOptions.delimiter === 'tab') delimiter = '\t';
      
      // Convert to CSV
      const csv = Papa.unparse(csvData, {
        delimiter,
        header: true,
        newline: '\r\n'
      });
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `${sanitizeFilename(collection.name)}.csv`;
      saveAs(blob, filename);
      
      setExportStatus('success');
      toast.success(`Collection exported to CSV successfully`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setExportStatus('error');
      toast.error('Failed to export collection to CSV');
    }
  };
  
  // Export collection to JSON
  const exportToJSON = async () => {
    try {
      setExportStatus('loading');
      
      // Import FileSaver
      const { saveAs } = await import('file-saver');
      
      let exportData;
      
      if (exportOptions.fileFormat === 'geojson') {
        // Create GeoJSON format
        exportData = {
          type: 'FeatureCollection',
          features: plaques.map(plaque => {
            // Only include plaques with coordinates
            if (!plaque.latitude || !plaque.longitude) return null;
            
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [parseFloat(plaque.longitude), parseFloat(plaque.latitude)]
              },
              properties: {
                id: plaque.id,
                title: plaque.title,
                location: plaque.location,
                color: plaque.color,
                profession: plaque.profession,
                visited: !!plaque.visited,
                inscription: exportOptions.includeInscriptions ? plaque.inscription : undefined,
                notes: exportOptions.includeNotes ? plaque.notes : undefined
              }
            };
          }).filter(Boolean) // Remove null features
        };
      } else {
        // Regular JSON format
        const collectionData = {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          icon: collection.icon,
          color: collection.color
        };
        
        if (exportOptions.includeTimestamps) {
          collectionData.created_at = collection.created_at;
          collectionData.updated_at = collection.updated_at;
        }
        
        // Filter plaque fields
        const filteredPlaques = plaques.map(plaque => {
          const filteredPlaque = {
            id: plaque.id,
            title: plaque.title,
            location: plaque.location,
            color: plaque.color,
            profession: plaque.profession
          };
          
          if (exportOptions.includeInscriptions && plaque.inscription) {
            filteredPlaque.inscription = plaque.inscription;
          }
          
          if (exportOptions.includeVisitStatus) {
            filteredPlaque.visited = !!plaque.visited;
          }
          
          if (exportOptions.includeCoordinates && plaque.latitude && plaque.longitude) {
            filteredPlaque.latitude = plaque.latitude;
            filteredPlaque.longitude = plaque.longitude;
          }
          
          if (exportOptions.includeNotes && plaque.notes) {
            filteredPlaque.notes = plaque.notes;
          }
          
          return filteredPlaque;
        });
        
        exportData = {
          collection: collectionData,
          plaques: filteredPlaques
        };
      }
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const fileType = exportOptions.fileFormat === 'geojson' ? 'geojson' : 'json';
      const filename = `${sanitizeFilename(collection.name)}.${fileType}`;
      saveAs(blob, filename);
      
      setExportStatus('success');
      toast.success(`Collection exported to ${fileType.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      setExportStatus('error');
      toast.error('Failed to export collection to JSON');
    }
  };
  
  // Export collection to GPX
  const exportToGPX = async () => {
    try {
      setExportStatus('loading');
      
      // Import FileSaver
      const { saveAs } = await import('file-saver');
      
      // Create GPX file content
      const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="Plaquer">
  <metadata>
    <name>${collection.name}</name>
    ${collection.description ? `<desc>${collection.description}</desc>` : ''}
    <time>${new Date().toISOString()}</time>
  </metadata>
  
  ${plaques.filter(p => p.latitude && p.longitude).map(plaque => `
  <wpt lat="${plaque.latitude}" lon="${plaque.longitude}">
    <name>${plaque.title}</name>
    ${plaque.location ? `<desc>${plaque.location}</desc>` : ''}
    <sym>Information</sym>
    ${exportOptions.includeVisitStatus ? `<extensions><visited>${plaque.visited ? 'yes' : 'no'}</visited></extensions>` : ''}
  </wpt>`).join('')}
  
  ${exportOptions.mapType === 'route' ? `
  <rte>
    <name>${collection.name} Route</name>
    ${plaques.filter(p => p.latitude && p.longitude).map(plaque => `
    <rtept lat="${plaque.latitude}" lon="${plaque.longitude}">
      <name>${plaque.title}</name>
    </rtept>`).join('')}
  </rte>` : ''}
</gpx>`;
      
      // Create blob and download
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const filename = `${sanitizeFilename(collection.name)}.gpx`;
      saveAs(blob, filename);
      
      setExportStatus('success');
      toast.success(`Collection exported to GPX successfully`);
    } catch (error) {
      console.error('Error exporting to GPX:', error);
      setExportStatus('error');
      toast.error('Failed to export collection to GPX');
    }
  };
  
  // Print collection
  const printCollection = () => {
    try {
      // Open a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Generate HTML content
      let printContent = `
        <html>
        <head>
          <title>${collection.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; }
            .plaque { margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; }
            .plaque h3 { margin-bottom: 5px; }
            .location { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
            .inscription { font-style: italic; margin: 10px 0; }
            .metadata { font-size: 13px; color: #6b7280; }
            @media print {
              body { font-size: 12pt; }
              .pagebreak { page-break-after: always; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; background: #f3f4f6; padding: 10px; border-radius: 5px;">
            <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
            <button onclick="window.close()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
          
          <h1>${collection.name}</h1>
      `;
      
      if (collection.description && exportOptions.includeDescription) {
        printContent += `<p>${collection.description}</p>`;
      }
      
      printContent += `<p>Collection contains ${plaques.length} plaques</p>`;
      
      // Add plaques
      plaques.forEach((plaque, index) => {
        printContent += `
          <div class="plaque">
            <h3>${index + 1}. ${plaque.title}</h3>
            <div class="location">${plaque.location || ''}</div>
        `;
        
        if (exportOptions.includeInscriptions && plaque.inscription) {
          printContent += `<div class="inscription">"${plaque.inscription}"</div>`;
        }
        
        printContent += `<div class="metadata">`;
        
        if (plaque.color || plaque.profession) {
          const details = [];
          if (plaque.color) details.push(`${plaque.color} plaque`);
          if (plaque.profession) details.push(plaque.profession);
          printContent += `${details.join(' • ')}`;
        }
        
        if (exportOptions.includeVisitStatus) {
          printContent += `<br>Visited: ${plaque.visited ? 'Yes' : 'No'}`;
        }
        
        if (exportOptions.includeCoordinates && plaque.latitude && plaque.longitude) {
          printContent += `<br>Coordinates: ${plaque.latitude}, ${plaque.longitude}`;
        }
        
        printContent += `</div></div>`;
        
        // Add page break every 5 plaques
        if ((index + 1) % 5 === 0 && index < plaques.length - 1) {
          printContent += `<div class="pagebreak"></div>`;
        }
      });
      
      printContent += `
        </body>
        </html>
      `;
      
      // Write to the new window and trigger print
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      toast.success('Print preview opened successfully');
    } catch (error) {
      console.error('Error printing collection:', error);
      toast.error('Failed to open print preview');
    }
  };
  
  // Share collection link (via navigator.share if available)
  const shareCollection = async () => {
    try {
      // Get shareable URL for collection
      const url = `https://plaquer.app/collections/${collection.id}`;
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: collection.name,
          text: `Check out my collection "${collection.name}" on Plaquer!`,
          url: url
        });
        toast.success('Collection shared successfully');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        toast.success('Collection link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing collection:', error);
      toast.error('Failed to share collection');
    }
  };
  
  // Copy collection link to clipboard
  const copyLink = async () => {
    try {
      // Get shareable URL for collection
      const url = `https://plaquer.app/collections/${collection.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success('Collection link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy collection link');
    }
  };
  
  // Perform export based on selected format
  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        exportToPDF();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'json':
        exportToJSON();
        break;
      case 'gpx':
        exportToGPX();
        break;
      case 'print':
        printCollection();
        break;
      case 'qr':
        generateQR();
        break;
      default:
        break;
    }
  };
  
  // Utility to sanitize filename
  const sanitizeFilename = (name) => {
    return name
      .replace(/[\/\\:*?"<>|]/g, '')  // Remove invalid characters
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .toLowerCase();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Collection</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="pdf" onValueChange={setExportFormat} className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="pdf" className="flex flex-col items-center gap-1 py-2">
              <FileText size={18} />
              <span className="text-xs">PDF</span>
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex flex-col items-center gap-1 py-2">
              <Table size={18} />
              <span className="text-xs">CSV</span>
            </TabsTrigger>
            <TabsTrigger value="json" className="flex flex-col items-center gap-1 py-2">
              <FileJson size={18} />
              <span className="text-xs">JSON</span>
            </TabsTrigger>
            <TabsTrigger value="gpx" className="flex flex-col items-center gap-1 py-2">
              <Map size={18} />
              <span className="text-xs">GPX</span>
            </TabsTrigger>
            <TabsTrigger value="print" className="flex flex-col items-center gap-1 py-2">
              <Printer size={18} />
              <span className="text-xs">Print</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex flex-col items-center gap-1 py-2">
              <QrCode size={18} />
              <span className="text-xs">QR Code</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="border-t mt-3 pt-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Settings size={14} /> Export Options
            </h3>
            
            {/* PDF Options */}
            <TabsContent value="pdf" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pdf-images"
                      checked={exportOptions.includeImages}
                      onCheckedChange={(checked) => handleOptionChange('includeImages', checked)}
                    />
                    <Label htmlFor="pdf-images">Include Images</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pdf-description"
                      checked={exportOptions.includeDescription}
                      onCheckedChange={(checked) => handleOptionChange('includeDescription', checked)}
                    />
                    <Label htmlFor="pdf-description">Include Description</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pdf-inscriptions"
                      checked={exportOptions.includeInscriptions}
                      onCheckedChange={(checked) => handleOptionChange('includeInscriptions', checked)}
                    />
                    <Label htmlFor="pdf-inscriptions">Include Inscriptions</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pdf-coordinates"
                      checked={exportOptions.includeCoordinates}
                      onCheckedChange={(checked) => handleOptionChange('includeCoordinates', checked)}
                    />
                    <Label htmlFor="pdf-coordinates">Include Coordinates</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pdf-visited"
                      checked={exportOptions.includeVisitStatus}
                      onCheckedChange={(checked) => handleOptionChange('includeVisitStatus', checked)}
                    />
                    <Label htmlFor="pdf-visited">Include Visit Status</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pdf-size">Page Size</Label>
                    <Select 
                      value={exportOptions.pageSize}
                      onValueChange={(value) => handleOptionChange('pageSize', value)}
                    >
                      <SelectTrigger id="pdf-size">
                        <SelectValue placeholder="Select page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="a5">A5</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pdf-color">Color Mode</Label>
                    <Select 
                      value={exportOptions.colorMode}
                      onValueChange={(value) => handleOptionChange('colorMode', value)}
                    >
                      <SelectTrigger id="pdf-color">
                        <SelectValue placeholder="Select color mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Color</SelectItem>
                        <SelectItem value="grayscale">Grayscale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* CSV Options */}
            <TabsContent value="csv" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="csv-inscriptions"
                      checked={exportOptions.includeInscriptions}
                      onCheckedChange={(checked) => handleOptionChange('includeInscriptions', checked)}
                    />
                    <Label htmlFor="csv-inscriptions">Include Inscriptions</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="csv-coordinates"
                      checked={exportOptions.includeCoordinates}
                      onCheckedChange={(checked) => handleOptionChange('includeCoordinates', checked)}
                    />
                    <Label htmlFor="csv-coordinates">Include Coordinates</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="csv-visited"
                      checked={exportOptions.includeVisitStatus}
                      onCheckedChange={(checked) => handleOptionChange('includeVisitStatus', checked)}
                    />
                    <Label htmlFor="csv-visited">Include Visit Status</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csv-delimiter">Delimiter</Label>
                    <Select 
                      value={exportOptions.delimiter}
                      onValueChange={(value) => handleOptionChange('delimiter', value)}
                    >
                      <SelectTrigger id="csv-delimiter">
                        <SelectValue placeholder="Select delimiter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comma">Comma (,)</SelectItem>
                        <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                        <SelectItem value="tab">Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* JSON Options */}
            <TabsContent value="json" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="json-inscriptions"
                      checked={exportOptions.includeInscriptions}
                      onCheckedChange={(checked) => handleOptionChange('includeInscriptions', checked)}
                    />
                    <Label htmlFor="json-inscriptions">Include Inscriptions</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="json-coordinates"
                      checked={exportOptions.includeCoordinates}
                      onCheckedChange={(checked) => handleOptionChange('includeCoordinates', checked)}
                    />
                    <Label htmlFor="json-coordinates">Include Coordinates</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="json-visited"
                      checked={exportOptions.includeVisitStatus}
                      onCheckedChange={(checked) => handleOptionChange('includeVisitStatus', checked)}
                    />
                    <Label htmlFor="json-visited">Include Visit Status</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="json-timestamps"
                      checked={exportOptions.includeTimestamps}
                      onCheckedChange={(checked) => handleOptionChange('includeTimestamps', checked)}
                    />
                    <Label htmlFor="json-timestamps">Include Timestamps</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="json-format">File Format</Label>
                    <Select 
                      value={exportOptions.fileFormat}
                      onValueChange={(value) => handleOptionChange('fileFormat', value)}
                    >
                      <SelectTrigger id="json-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">Standard JSON</SelectItem>
                        <SelectItem value="geojson">GeoJSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* GPX Options */}
            <TabsContent value="gpx" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="gpx-visited"
                      checked={exportOptions.includeVisitStatus}
                      onCheckedChange={(checked) => handleOptionChange('includeVisitStatus', checked)}
                    />
                    <Label htmlFor="gpx-visited">Include Visit Status</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gpx-map-type">Map Type</Label>
                    <Select 
                      value={exportOptions.mapType}
                      onValueChange={(value) => handleOptionChange('mapType', value)}
                    >
                      <SelectTrigger id="gpx-map-type">
                        <SelectValue placeholder="Select map type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markers">Waypoints Only</SelectItem>
                        <SelectItem value="route">Route</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {exportOptions.mapType === 'route' && (
                    <div className="space-y-2">
                      <Label htmlFor="gpx-route-optimization">Route Optimization</Label>
                      <Select 
                        value={exportOptions.routeOptimization}
                        onValueChange={(value) => handleOptionChange('routeOptimization', value)}
                      >
                        <SelectTrigger id="gpx-route-optimization">
                          <SelectValue placeholder="Select optimization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Original Order)</SelectItem>
                          <SelectItem value="distance">Optimize by Distance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Print Options */}
            <TabsContent value="print" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="print-description"
                      checked={exportOptions.includeDescription}
                      onCheckedChange={(checked) => handleOptionChange('includeDescription', checked)}
                    />
                    <Label htmlFor="print-description">Include Description</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="print-inscriptions"
                      checked={exportOptions.includeInscriptions}
                      onCheckedChange={(checked) => handleOptionChange('includeInscriptions', checked)}
                    />
                    <Label htmlFor="print-inscriptions">Include Inscriptions</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="print-coordinates"
                      checked={exportOptions.includeCoordinates}
                      onCheckedChange={(checked) => handleOptionChange('includeCoordinates', checked)}
                    />
                    <Label htmlFor="print-coordinates">Include Coordinates</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="print-visited"
                      checked={exportOptions.includeVisitStatus}
                      onCheckedChange={(checked) => handleOptionChange('includeVisitStatus', checked)}
                    />
                    <Label htmlFor="print-visited">Include Visit Status</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* QR Code Options */}
            <TabsContent value="qr" className="mt-0">
              <div className="flex flex-col items-center space-y-4">
                <div className="border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center">
                  <QrCode size={80} className="text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 text-center">
                    Generate a QR code for sharing this collection.<br />
                    Anyone with the QR code can view this collection.
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={copyLink}
                  >
                    <Copy size={16} />
                    Copy Link
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={shareCollection}
                  >
                    <Share2 size={16} />
                    Share
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="border-t pt-4 mt-4">
          <div className="text-sm text-gray-500 mb-4">
            <p>This will export {plaques.length} plaques from your "{collection.name}" collection.</p>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleExport}
            disabled={exportStatus === 'loading'}
            className="min-w-[100px]"
          >
            {exportStatus === 'loading' ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                {exportFormat === 'qr' ? 'Generate QR' : 
                 exportFormat === 'print' ? 'Print' : 
                 `Export as ${exportFormat.toUpperCase()}`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionExport;