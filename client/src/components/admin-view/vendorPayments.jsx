import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileDown,
  FileText,
  Download,
  Check,
  X,
  Clock,
  AlertCircle,
  Filter,
  RefreshCw,
  DollarSign,
  Calendar,
  Eye,
  BadgeCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/config/api';

const VendorPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    paymentCount: 0,
    pendingCount: 0,
    lastPaymentDate: null,
    lastPaymentAmount: 0,
    unviewedCount: 0
  });
  const { toast } = useToast();

  // Fetch payments on mount
  useEffect(() => {
    fetchPayments();
    fetchPaymentSummary();
  }, []);

  // Fetch payment history
  const fetchPayments = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      
      params.append('page', page);
      params.append('limit', 10);
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }
      
      // Add any additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/admin/vendor-payments/history?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching payments: ${response.statusText}`);
      }

      const data = await response.json();
      setPayments(data.data);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount
      });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment history. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment summary
  const fetchPaymentSummary = async () => {
    try {
      const response = await fetch('/api/admin/vendor-payments/summary', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching payment summary: ${response.statusText}`);
      }

      const data = await response.json();
      setPaymentSummary(data.data);
      
      // If there are unviewed payments, update the badge count
      if (data.data.unviewedCount > 0) {
        // You could update a global notification state here
      }
    } catch (error) {
      console.error('Failed to fetch payment summary:', error);
    }
  };

  // Fetch payment details
  const fetchPaymentDetails = async (paymentId) => {
    try {
      const response = await fetch(`/api/admin/vendor-payments/${paymentId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching payment details: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedPayment(data.data);
      
      // Refresh summary to update unviewed count
      fetchPaymentSummary();
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment details. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Apply filters
  const applyFilters = () => {
    fetchPayments(1);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    fetchPayments(1);
  };

  // Handle pagination
  const handlePagination = (page) => {
    fetchPayments(page);
  };

  // Status badge renderer
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1" /> Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><X className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-muted-foreground">View your payment history and receipts</p>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-500" />
              Total Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(paymentSummary.totalPaid)}
            </div>
            <p className="text-muted-foreground text-sm">
              {loading ? <Skeleton className="h-4 w-24 mt-1" /> : `${paymentSummary.paymentCount} completed payments`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-4 h-4 mr-2 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(paymentSummary.pendingAmount)}
            </div>
            <p className="text-muted-foreground text-sm">
              {loading ? <Skeleton className="h-4 w-24 mt-1" /> : `${paymentSummary.pendingCount} pending payments`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              Last Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(paymentSummary.lastPaymentAmount)}
            </div>
            <p className="text-muted-foreground text-sm">
              {loading ? <Skeleton className="h-4 w-24 mt-1" /> : (
                paymentSummary.lastPaymentDate 
                  ? formatDate(paymentSummary.lastPaymentDate)
                  : 'No payments yet'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filter Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    {Array(7).fill(0).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                // No payments found
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-10 w-10 mb-2" />
                      <p>No payment records found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Payment rows
                payments.map((payment) => (
                  <TableRow key={payment._id} className={payment.viewedAt ? '' : 'bg-blue-50'}>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">From:</span>
                        <span>{formatDate(payment.periodStart)}</span>
                        <span className="text-xs text-muted-foreground mt-1">To:</span>
                        <span>{formatDate(payment.periodEnd)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethod}
                      {payment.transactionId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Ref: {payment.transactionId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      {payment.receiptUrl ? (
                        <a 
                          href={`${API_BASE_URL}${payment.receiptUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(payment.createdAt)}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(null); // Clear first
                          fetchPaymentDetails(payment._id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {!loading && payments.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {payments.length} of {pagination.totalCount} payments
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => handlePagination(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                {[...Array(pagination.totalPages).keys()].map((page) => (
                  <Button
                    key={page + 1}
                    variant={pagination.currentPage === page + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePagination(page + 1)}
                  >
                    {page + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => handlePagination(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Amount:</Label>
                <div className="col-span-3">
                  {formatCurrency(selectedPayment.amount)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Period:</Label>
                <div className="col-span-3">
                  {formatDate(selectedPayment.periodStart)} to {formatDate(selectedPayment.periodEnd)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Payment Method:</Label>
                <div className="col-span-3">
                  {selectedPayment.paymentMethod}
                  {selectedPayment.transactionId && (
                    <div className="text-sm text-muted-foreground">
                      Reference: {selectedPayment.transactionId}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Status:</Label>
                <div className="col-span-3">
                  {renderStatusBadge(selectedPayment.status)}
                  {selectedPayment.status === 'completed' && (
                    <div className="flex items-center text-green-600 mt-1 text-sm">
                      <BadgeCheck className="h-3 w-3 mr-1" /> 
                      Verified payment
                    </div>
                  )}
                </div>
              </div>
              {selectedPayment.notes && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Notes:</Label>
                  <div className="col-span-3">
                    {selectedPayment.notes}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created:</Label>
                <div className="col-span-3">
                  {formatDate(selectedPayment.createdAt)} 
                  <span className="text-muted-foreground ml-1 text-sm">
                    ({formatDistanceToNow(new Date(selectedPayment.createdAt), { addSuffix: true })})
                  </span>
                </div>
              </div>
              {selectedPayment.processedAt && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Processed:</Label>
                  <div className="col-span-3">
                    {formatDate(selectedPayment.processedAt)}
                    {selectedPayment.processedBy && (
                      <span className="text-muted-foreground ml-1 text-sm">
                        by {selectedPayment.processedBy.userName || 'Administrator'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedPayment.receiptUrl && (
                <div className="mt-4">
                  <div className="flex justify-center">
                    <a 
                      href={`${API_BASE_URL}${selectedPayment.receiptUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download Receipt
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPayments; 