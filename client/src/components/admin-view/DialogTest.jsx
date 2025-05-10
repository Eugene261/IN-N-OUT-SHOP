import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export default function DialogTest() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Dialog Test</h1>
      
      <button 
        onClick={() => {
          console.log('Opening dialog');
          setOpen(true);
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Open Dialog
      </button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>This is a test dialog to verify functionality.</p>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
