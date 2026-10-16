import React, { useState, useRef } from 'react';
import {
  X,
  Receipt,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ShoppingBag,
  Clock,
  ClipboardPaste,
  Check
} from 'lucide-react';
import { InventoryItem } from '../types';
import { scanReceiptWithBianca, ScannedReceiptResult } from '../services/geminiService';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItemsToInventory: (items: Array<Omit<InventoryItem, 'id' | 'addedDate'>>) => void;
}

type ReceiptTab = 'file' | 'paste';

interface ScannedItemRow {
  name: string;
  quantity: number;
  unit: string;
  category: InventoryItem['category'];
  location: InventoryItem['location'];
  expiryDate: string; // YYYY-MM-DD
  checked: boolean;
  estimatedPrice?: number;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onAddItemsToInventory,
}) => {
  const [tab, setTab] = useState<ReceiptTab>('file');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text state
  const [pastedText, setPastedText] = useState('');

  // Scanning status
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scanned results
  const [storeName, setStoreName] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItemRow[] | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(result);
      } else {
        setFilePreviewUrl(null);
      }
    };
    reader.onerror = () => setErrorMessage('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleScanReceipt = async () => {
    setErrorMessage(null);
    if (tab === 'file' && !fileBase64) {
      setErrorMessage('Please select or drop a receipt photo or PDF first.');
      return;
    }
    if (tab === 'paste' && !pastedText.trim()) {
      setErrorMessage('Please paste receipt or order text first.');
      return;
    }

    setIsScanning(true);
    setScanStep('Analyzing receipt image and text vision...');

    try {
      const stepTimer1 = setTimeout(() => {
        setScanStep('Identifying grocery line items and normalizing names...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setScanStep('Categorizing produce, dairy, proteins and calculating shelf-life...');
      }, 2400);

      const result: ScannedReceiptResult = await scanReceiptWithBianca({
        mode: tab === 'paste' ? 'text' : 'file',
        fileBase64: fileBase64 || undefined,
        mimeType: selectedFile?.type || 'image/jpeg',
        text: tab === 'paste' ? pastedText : undefined,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setStoreName(result.storeName || 'Supermarket');

      const today = new Date();
      const mappedRows: ScannedItemRow[] = (result.items || []).map((it) => {
        const expDate = new Date();
        expDate.setDate(today.getDate() + (it.estimatedExpiryDays || 7));
        return {
          name: it.name,
          quantity: it.quantity || 1,
          unit: it.unit || 'pcs',
          category: it.category || 'Produce',
          location: it.location || 'Fridge',
          expiryDate: expDate.toISOString().split('T')[0],
          checked: true,
          estimatedPrice: it.estimatedPrice,
        };
      });

      setScannedItems(mappedRows);
    } catch (err: any) {
      console.error('Receipt scan error:', err);
      setErrorMessage(err.message || 'Failed to scan receipt. Please try again.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleToggleCheck = (index: number) => {
    if (!scannedItems) return;
    const copy = [...scannedItems];
    copy[index].checked = !copy[index].checked;
    setScannedItems(copy);
  };

  const handleUpdateItem = (index: number, field: keyof ScannedItemRow, value: any) => {
    if (!scannedItems) return;
    const copy = [...scannedItems];
    copy[index] = { ...copy[index], [field]: value };
    setScannedItems(copy);
  };

  const handleRemoveItem = (index: number) => {
    if (!scannedItems) return;
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const handleConfirmAdd = () => {
    if (!scannedItems) return;
    const checked = scannedItems.filter((i) => i.checked);
    if (checked.length === 0) {
      setErrorMessage('Please select at least one item to stock.');
      return;
    }

    onAddItemsToInventory(
      checked.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        category: i.category,
        location: i.location,
        expiryDate: i.expiryDate,
        estimatedPrice: i.estimatedPrice,
      }))
    );

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setFilePreviewUrl(null);
    setPastedText('');
    setScannedItems(null);
    setErrorMessage(null);
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-100 flex items-center gap-2">
                <span>{scannedItems ? 'Review Grocery Items' : 'Scan Grocery Receipt'}</span>
              </h2>
              <p className="text-xs text-stone-400">
                {scannedItems
                  ? `Extracted from ${storeName}. Check off items to stock directly into your pantry!`
                  : 'Take a photo of your supermarket receipt, upload a PDF, or paste delivery text to auto-stock inventory.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Form when not scanned yet */}
          {!scannedItems && (
            <div className="space-y-6">
              {/* Tab selector */}
              <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800 gap-1">
                <button
                  type="button"
                  onClick={() => setTab('file')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    tab === 'file'
                      ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/60'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Receipt Photo / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('paste')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    tab === 'paste'
                      ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/60'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4 text-blue-400" />
                  <span>Paste Text Order</span>
                </button>
              </div>

              {tab === 'file' && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-amber-500 bg-amber-500/5'
                      : selectedFile
                      ? 'border-amber-500/60 bg-stone-950/60'
                      : 'border-stone-800 hover:border-stone-700 bg-stone-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="space-y-3">
                      {filePreviewUrl ? (
                        <div className="relative inline-block mx-auto max-w-xs max-h-48 overflow-hidden rounded-xl border border-stone-700 shadow-lg">
                          <img
                            src={filePreviewUrl}
                            alt="Receipt Preview"
                            className="w-full h-full object-cover max-h-44"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Receipt className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-stone-200">{selectedFile.name}</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to scan
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Grocery AI Extraction</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-center text-stone-400">
                        <Upload className="w-7 h-7 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-stone-200">
                          Upload receipt photo or PDF
                        </h4>
                        <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                          Snap a photo of your paper store receipt or upload an online grocery delivery invoice (.jpg, .png, .pdf).
                        </p>
                      </div>
                      <span className="inline-block px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium border border-stone-700">
                        Browse Files
                      </span>
                    </div>
                  )}
                </div>
              )}

              {tab === 'paste' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300">
                      Grocery Order or Receipt Text
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPastedText(`Trader Joe's Supermarket
02/10/2026
1 Organic Whole Milk 1GAL - $4.49
2 Boneless Skinless Chicken Breasts - $8.99
1 Baby Spinach 16oz - $2.99
6 Roma Tomatoes - $1.80
1 Jasmine Rice 2lb - $3.49
1 Salted Butter 16oz - $3.99
1 Dozen Cage Free Large Eggs - $4.29
1 Olive Oil Extra Virgin 500ml - $7.99`)
                      }
                      className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      Try Sample Order
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste order confirmation or receipt items here..."
                    className="w-full p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              )}

              {isScanning && (
                <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    <div>
                      <p className="text-xs font-semibold text-stone-200">
                        Scanning Receipt with Bianca AI...
                      </p>
                      <p className="text-[11px] text-amber-400 animate-pulse font-mono mt-0.5">
                        {scanStep || 'Extracting grocery items...'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isScanning || (tab === 'file' && !selectedFile) || (tab === 'paste' && !pastedText.trim())}
                  onClick={handleScanReceipt}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting Groceries...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Extract & Parse Groceries</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results table when scanned */}
          {scannedItems && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between bg-stone-950/60 p-3 rounded-xl border border-stone-800 text-xs">
                <div className="flex items-center gap-2 text-stone-200">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Store: <strong className="text-stone-100">{storeName}</strong> ({scannedItems.length} items detected)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScannedItems(null)}
                  className="text-stone-400 hover:text-stone-200 underline text-[11px]"
                >
                  Scan another receipt
                </button>
              </div>

              <div className="space-y-2">
                {scannedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                      item.checked
                        ? 'bg-stone-900 border-stone-700/80'
                        : 'bg-stone-950/40 border-stone-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleCheck(idx)}
                        className="w-4 h-4 rounded border-stone-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="bg-transparent font-medium text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-b border-stone-600 w-full"
                        />
                        <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>{item.category}</span>
                          <span>·</span>
                          <span className="text-emerald-400">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-14 p-1 bg-stone-950 border border-stone-700 rounded text-center text-xs text-stone-100 font-mono"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                          className="w-14 p-1 bg-stone-950 border border-stone-700 rounded text-center text-xs text-stone-200"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleUpdateItem(idx, 'expiryDate', e.target.value)}
                          className="p-1 bg-stone-950 border border-stone-700 rounded text-[11px] text-stone-200"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-stone-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-900/90 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>

          {scannedItems && (
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Stock {scannedItems.filter((i) => i.checked).length} Items into Pantry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
