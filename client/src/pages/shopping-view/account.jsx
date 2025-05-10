import React from 'react'
import accountImage from '../../assets/account.jpg'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Address from '@/components/shopping-view/address';
import ShoppingOrders from '@/components/shopping-view/orders';

function ShoppingAccount() {
  return (
    <div className='flex flex-col '>
      <div className="relative h-[350px] w-full overflow-hidden">
        <img 
        src={accountImage}
        className='h-full w-full object-cover object-center'
        />
      </div>
      <div className="container mx-auto grid grid-cols-1 gap-8 py-8">
        <div className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
          <Tabs defaultValue='orders' >
            <TabsList  >
              <TabsTrigger value='orders' className='cursor-pointer'>Orders</TabsTrigger>
              <TabsTrigger value='address' className='cursor-pointer'>Address</TabsTrigger>
            </TabsList>

            <TabsContent value='orders' >
                <ShoppingOrders/>
            </TabsContent>
            <TabsContent value='address' >
                <Address />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default ShoppingAccount;