import { describe, expect, it } from 'vitest';
import { importColumnLabel, pickImportSheet, rowsFromSheet } from './stockImport';

const HEADINGS = ['Part Name *', 'SKU *', 'Part Number', 'Unit *', 'Opening Stock', 'Branch'];

describe('rowsFromSheet', () => {
  it('labels cells by heading and keeps the Excel row number', () => {
    const { rows, missingColumns } = rowsFromSheet([
      HEADINGS,
      ['Hydraulic Filter', 'JCB-HF-001', '32/925346', 'PCS', 42, 'Hyderabad'],
      [null, null, null, null, null, null],
      ['  Coolant ', 'GEN-CL-001', '', 'LTR', 12.5, null],
    ]);
    expect(missingColumns).toEqual([]);
    expect(rows).toEqual([
      {
        rowNumber: 2,
        name: 'Hydraulic Filter',
        sku: 'JCB-HF-001',
        partNumber: '32/925346',
        unit: 'PCS',
        openingStock: 42,
        branch: 'Hyderabad',
      },
      // Row 3 is empty and left out; blanks inside a row are simply not sent.
      { rowNumber: 4, name: 'Coolant', sku: 'GEN-CL-001', unit: 'LTR', openingStock: 12.5 },
    ]);
  });

  it('accepts headings in any case, order and spacing', () => {
    const { rows } = rowsFromSheet([
      ['sku', 'UNIT', ' part name ', 'gst %', 'Min  Stock Level'],
      ['A-1', 'PCS', 'Bolt', 18, 5],
    ]);
    expect(rows[0]).toEqual({
      rowNumber: 2,
      sku: 'A-1',
      unit: 'PCS',
      name: 'Bolt',
      gstRate: 18,
      minStockLevel: 5,
    });
  });

  it('reports required columns that are missing and columns it does not know', () => {
    const result = rowsFromSheet([
      ['Part Name', 'Rack', 'Opening Stock'],
      ['Bolt', 'A1', 3],
    ]);
    expect(result.missingColumns).toEqual(['SKU', 'Unit']);
    expect(result.unknownColumns).toEqual(['Rack']);
  });

  it('handles an empty sheet', () => {
    expect(rowsFromSheet([])).toEqual({
      rows: [],
      missingColumns: ['Part Name', 'SKU', 'Unit'],
      unknownColumns: [],
    });
  });
});

describe('pickImportSheet', () => {
  const stock = { sheet: 'Stock Data', data: [HEADINGS] };
  it('prefers the Stock Data sheet, else one with an SKU heading', () => {
    expect(pickImportSheet([{ sheet: 'Instructions', data: [['How to']] }, stock])).toBe(stock);
    const renamed = { sheet: 'Sheet1', data: [['Part Name', 'SKU', 'Unit']] };
    expect(pickImportSheet([{ sheet: 'Notes', data: [] }, renamed])).toBe(renamed);
    expect(pickImportSheet([{ sheet: 'Notes', data: [['hello']] }])).toBeNull();
  });
});

describe('importColumnLabel', () => {
  it('names the template column for a server field', () => {
    expect(importColumnLabel('sellingPrice')).toBe('Selling Price');
    expect(importColumnLabel('gstRate')).toBe('GST %');
  });
});
