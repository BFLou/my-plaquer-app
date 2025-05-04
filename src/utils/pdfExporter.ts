// src/utils/pdfExporter.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { EnhancedCollection } from '@/types/collection';
import { Plaque } from '@/types/plaque';

// Add type augmentation for jsPDF to support autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportCollectionToPDF = async (
  collection: EnhancedCollection, 
  plaques: Plaque[]
) => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Define some styling variables
  const primaryColor = '#3b82f6'; // blue-500
  const textColor = '#1f2937'; // gray-800
  const lightGray = '#f3f4f6'; // gray-100
  
  // Add title
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text(collection.name, 20, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.text(`Created: ${new Date(collection.dateCreated).toLocaleDateString()}`, 20, 30);
  doc.text(`Plaques: ${plaques.length}`, 20, 35);
  
  // Add collection description if available
  if (collection.description) {
    doc.setFontSize(12);
    doc.text('Description:', 20, 45);
    doc.setFontSize(10);
    doc.text(collection.description, 20, 50, { maxWidth: 170 });
  }
  
  // Add collaborators if any
  if (collection.collaborators.length > 0) {
    const yPos = collection.description ? 65 : 45;
    doc.setFontSize(12);
    doc.text('Collaborators:', 20, yPos);
    doc.setFontSize(10);
    
    collection.collaborators.forEach((collaborator, index) => {
      doc.text(`- ${collaborator.name}`, 20, yPos + 5 + (index * 5));
    });
  }
  
  // Add plaques table
  const startY = collection.collaborators.length > 0 
    ? (collection.description ? 75 : 55) + (collection.collaborators.length * 5)
    : (collection.description ? 65 : 45);
  
  // Add plaques header
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text('Plaques in this Collection', 20, startY);
  
  // Check if we have plaques
  if (plaques.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text('No plaques in this collection.', 20, startY + 10);
  } else {
    // Create table data
    const tableColumn = ['Title', 'Location', 'Description', 'Tags'];
    const tableRows = plaques.map(plaque => [
      plaque.title || 'Untitled',
      plaque.location || plaque.address || 'Unknown location',
      plaque.description || plaque.inscription || 'No description',
      plaque.tags?.join(', ') || ''
    ]);
    
    // Add table to document
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY + 5,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: '#ffffff',
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      margin: { top: 10 },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Title
        1: { cellWidth: 40 }, // Location
        2: { cellWidth: 70 }, // Description
        3: { cellWidth: 30 }  // Tags
      }
    });
  }
  
  // Add map page if plaques have coordinates
  const plaquesWithCoordinates = plaques.filter(
    p => p.latitude && p.longitude && !isNaN(parseFloat(p.latitude as unknown as string))
  );
  
  if (plaquesWithCoordinates.length > 0) {
    // Add new page for map
    doc.addPage();
    
    // Add map title
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('Plaque Locations Map', 20, 20);
    
    // Create map using third-party service
    // For example, using Google Static Maps API or OpenStreetMap
    
    // For demo purposes, we'll add a placeholder
    doc.setFillColor(lightGray);
    doc.rect(20, 30, 170, 100, 'F');
    doc.setFontSize(12);
    doc.setTextColor(textColor);
    doc.text('Map Image Would Be Generated Here', 70, 80);
    
    // List coordinates below the map
    doc.setFontSize(10);
    doc.text('Plaque Coordinates:', 20, 140);
    
    plaquesWithCoordinates.forEach((plaque, index) => {
      const lat = parseFloat(plaque.latitude as unknown as string);
      const lng = parseFloat(plaque.longitude as unknown as string);
      doc.text(
        `${index + 1}. ${plaque.title}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 
        20, 
        150 + (index * 5)
      );
    });
  }
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#6b7280'); // gray-500
    doc.text(
      `${collection.name} - Generated with Plaquer App - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`${collection.name.replace(/\s+/g, '-').toLowerCase()}-collection.pdf`);
  
  return true;
};