import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { FormData } from '../types';

const currencySymbols: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    width: '70%',
    color: '#111827',
  },
  signature: {
    marginTop: 30,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    width: '60%',
    marginTop: 30,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563eb',
  },
  contractText: {
    marginTop: 10,
    marginBottom: 10,
    lineHeight: 1.6,
    color: '#374151',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginVertical: 15,
  },
  warningText: {
    color: '#DC2626',
    fontSize: 10,
    marginTop: 5,
  },
});

const ContractPDF: React.FC<{ data: FormData }> = ({ data }) => {
  const currencySymbol = currencySymbols[data.currency] || '$';
  const formattedPrice = data.price.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>VEHICLE SALES AGREEMENT</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agreement Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{format(new Date(), 'MMMM dd, yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sale Price:</Text>
            <Text style={styles.value}>
              {currencySymbol}{formattedPrice} {data.currency}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          {data.vin && (
            <View style={styles.row}>
              <Text style={styles.label}>VIN:</Text>
              <Text style={styles.value}>{data.vin}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Make:</Text>
            <Text style={styles.value}>{data.make}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Model:</Text>
            <Text style={styles.value}>{data.model}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Year:</Text>
            <Text style={styles.value}>{data.year}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mileage:</Text>
            <Text style={styles.value}>{data.mileage.toLocaleString()} miles</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Condition:</Text>
            <Text style={styles.value}>{data.condition}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.contractText}>
            The undersigned purchaser acknowledges receipt of the above vehicle in exchange for the cash sum of {currencySymbol}{formattedPrice} {data.currency}, this being the price agreed by the purchaser with the vendor for the above-named vehicle, receipt of which the vendor hereby acknowledges.
          </Text>
          
          <Text style={styles.contractText}>
            It is understood by the purchaser that the vehicle is sold as seen, tried, and approved without guarantee, with the following condition:
          </Text>
          
          <Text style={styles.contractText}>
            The purchaser holds the right to return the vehicle and is entitled to a full refund of the vehicle's purchase price if, within 14 days of the purchase date, the vehicle is found, through first-hand verifiable recorded inspection or professional assessment, to have significant defects or undisclosed issues affecting its condition or safety that were not made known at the time of sale.
          </Text>
          
          <Text style={styles.contractText}>
            Upon exercising this right, the purchaser agrees to return the vehicle to the vendor in the condition it was received. The vendor agrees to refund the full purchase amount to the purchaser within 14 days of the vehicle's return.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentation Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Registration:</Text>
            <Text style={styles.value}>{data.registration ? 'Verified' : 'Not Verified'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Insurance:</Text>
            <Text style={styles.value}>{data.insurance ? 'Verified' : 'Not Verified'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Inspection:</Text>
            <Text style={styles.value}>{data.inspection ? 'Completed' : 'Not Completed'}</Text>
          </View>
        </View>

        {data.inspection && data.inspectionNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspection Notes</Text>
            <Text style={styles.contractText}>{data.inspectionNotes}</Text>
          </View>
        )}

        <View style={styles.signature}>
          <View style={styles.row}>
            <View style={{ width: '45%' }}>
              <Text>Seller's Signature:</Text>
              <View style={styles.signatureLine} />
              <Text>Date: {format(new Date(), 'MM/dd/yyyy')}</Text>
            </View>
            <View style={{ width: '10%' }} />
            <View style={{ width: '45%' }}>
              <Text>Buyer's Signature:</Text>
              <View style={styles.signatureLine} />
              <Text>Date: {format(new Date(), 'MM/dd/yyyy')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.warningText}>
          This document is legally binding. Both parties should retain a signed copy for their records.
        </Text>
      </Page>
    </Document>
  );
};

export const PDFPreview: React.FC<{ data: FormData }> = ({ data }) => {
  const viewerHeight = typeof window !== 'undefined' 
    ? Math.min(window.innerHeight * 0.7, 500)
    : 500;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <div className="relative w-full" style={{ height: viewerHeight }}>
        <PDFViewer 
          style={{ 
            width: '100%', 
            height: '100%',
            border: 'none',
            backgroundColor: 'rgb(249, 250, 251)'
          }}
        >
          <ContractPDF data={data} />
        </PDFViewer>
      </div>
      <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        Pinch or spread to zoom • Scroll to navigate
      </div>
    </div>
  );
};

export const generatePDF = async (data: FormData): Promise<Blob> => {
  return await pdf(<ContractPDF data={data} />).toBlob();
};