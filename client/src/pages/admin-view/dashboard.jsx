import React from 'react'
import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import RevenueDashboard from '@/components/admin-view/revenueDashboard'
import StockAlertsDashboard from '@/components/admin-view/stockAlertsDashboard'

function AdminDashboard() {
  const dispatch = useDispatch();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  // Feature image management functions have been removed as they're now SuperAdmin-only features

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Revenue Dashboard Section */}
        <RevenueDashboard />
        
        {/* Stock Alerts Dashboard Section */}
        <StockAlertsDashboard />
      </motion.div>
    </div>
  )
}

export default AdminDashboard