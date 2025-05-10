import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { verifyPayment } from '@/services/paystackService'
import { toast } from 'sonner'

function OrderConfirmationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [verificationStatus, setVerificationStatus] = useState('loading') // 'loading', 'success', 'failed'
  const [orderDetails, setOrderDetails] = useState(null)
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const reference = params.get('reference')

    if (reference) {
      setTransactionId(reference)
      // Verify the payment with Paystack
      verifyPayment(reference)
        .then(response => {
          if (response.success && response.data.status === 'success') {
            setVerificationStatus('success')
            setOrderDetails(response.data)
            toast.success('Payment verified successfully!')
          } else {
            setVerificationStatus('failed')
            toast.error('Payment verification failed')
          }
        })
        .catch(error => {
          console.error('Payment verification error:', error)
          setVerificationStatus('failed')
          toast.error('Error verifying payment')
        })
    } else {
      // No reference found, might be a direct access
      setVerificationStatus('failed')
    }
  }, [location])

  const checkmarkVariants = {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 }
  }

  const renderIcon = () => {
    if (verificationStatus === 'loading') {
      return (
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' }
          }}
        >
          <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
          <Loader className="w-20 h-20 text-blue-400 relative z-10" />
        </motion.div>
      )
    } else if (verificationStatus === 'success') {
      return (
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
          <CheckCircle className="w-20 h-20 text-emerald-400 relative z-10" />
        </motion.div>
      )
    } else {
      return (
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
          <XCircle className="w-20 h-20 text-red-400 relative z-10" />
        </motion.div>
      )
    }
  }

  const renderTitle = () => {
    if (verificationStatus === 'loading') {
      return 'Verifying Payment...'
    } else if (verificationStatus === 'success') {
      return 'Payment Confirmed'
    } else {
      return 'Payment Failed'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20" />

          <CardHeader className="items-center text-center space-y-6">
            {renderIcon()}

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {renderTitle()}
            </CardTitle>
          </CardHeader>

          <div className="p-6 pt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center space-y-2"
            >
              {verificationStatus === 'loading' && (
                <p className="text-gray-300 text-lg">
                  Please wait while we verify your payment...
                </p>
              )}

              {verificationStatus === 'success' && (
                <>
                  <p className="text-gray-300 text-lg">
                    Your order has been successfully processed
                  </p>
                  <p className="text-gray-400 text-sm">
                    Transaction ID: {transactionId || `#STP-${Math.floor(Math.random() * 1000000)}`}
                  </p>
                  {orderDetails && orderDetails.metadata && orderDetails.metadata.orderId && (
                    <p className="text-gray-400 text-sm">
                      Order ID: {orderDetails.metadata.orderId}
                    </p>
                  )}
                </>
              )}

              {verificationStatus === 'failed' && (
                <>
                  <p className="text-gray-300 text-lg">
                    We couldn't verify your payment
                  </p>
                  <p className="text-gray-400 text-sm">
                    Please contact customer support if you believe this is an error
                  </p>
                </>
              )}
            </motion.div>

            <div className="space-y-4">
              {verificationStatus !== 'loading' && (
                <>
                  {verificationStatus === 'success' && (
                    <button
                      onClick={() => navigate('/shop/account')}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      View Your Orders
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/shop/home')}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {verificationStatus === 'success' ? 'Continue Shopping' : 'Return to Shop'}
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default OrderConfirmationPage