import AdminOrdersView from '@/components/admin-view/adminOrdersView';
import React from 'react'


function AdminOrders() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <p className="text-gray-500 mb-8">View and manage orders containing your products</p>
      <AdminOrdersView />
    </div>
  )
}

export default AdminOrders;