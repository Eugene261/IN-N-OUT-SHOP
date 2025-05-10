import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

function DeleteConfirmationDialog({ isOpen, setIsOpen, productToDelete, onConfirmDelete }) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-black/80 backdrop-blur-lg border border-red-500/20 text-white rounded-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="flex flex-col items-center space-y-4 pt-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-red-500/20 p-3 rounded-full"
            >
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </motion.div>
            <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-500">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 mb-6 text-center">
            <p className="text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-red-400">{productToDelete?.title}</span>?
            </p>
            <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
          </div>

          <DialogFooter className="flex flex-row justify-center gap-4 sm:justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 rounded-lg bg-gray-700/50 backdrop-blur text-gray-200 font-medium hover:bg-gray-600/50 transition-colors duration-300 border border-gray-600/50"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-500 hover:to-red-600 transition-colors duration-300 shadow-lg shadow-red-500/20"
              onClick={() => {
                onConfirmDelete();
                setIsOpen(false);
              }}
            >
              Delete
            </motion.button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteConfirmationDialog;