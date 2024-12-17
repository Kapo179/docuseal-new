import { createClient } from '@supabase/supabase-js';
import type { FormData } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export async function generateContract(formData: FormData): Promise<string> {
  try {
    // Fetch the latest contract template
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('content')
      .eq('name', 'vehicle_sale')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (templateError) throw templateError;
    if (!template) throw new Error('No contract template found');

    // Replace placeholders with actual data
    let contractContent = template.content;
    
    const replacements = {
      '{{vin}}': formData.vin || 'Not Provided',
      '{{make}}': formData.make,
      '{{model}}': formData.model,
      '{{year}}': formData.year.toString(),
      '{{mileage}}': formData.mileage.toLocaleString(),
      '{{condition}}': formData.condition,
      '{{date}}': new Date().toLocaleDateString(),
      '{{inspection_notes}}': formData.inspectionNotes || 'No inspection notes provided',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      contractContent = contractContent.replace(new RegExp(key, 'g'), value);
    });

    // Store the generated contract
    const { error: insertError } = await supabase
      .from('generated_contracts')
      .insert({
        content: contractContent,
        form_data: formData,
        status: 'generated',
      });

    if (insertError) throw insertError;

    return contractContent;
  } catch (error) {
    console.error('Failed to generate contract:', error);
    throw new Error('Failed to generate contract');
  }
}