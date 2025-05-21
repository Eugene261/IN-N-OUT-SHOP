// ... existing code ...
app.use('/api/superAdmin/revenue', superAdminRevenueRouter);

// Register vendor payment routes
app.use('/api/admin/vendor-payments', adminVendorPaymentRouter);
app.use('/api/superAdmin/vendor-payments', superAdminVendorPaymentRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
}) 