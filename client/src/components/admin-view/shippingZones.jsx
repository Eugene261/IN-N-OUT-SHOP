import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  getShippingZones, 
  createShippingZone, 
  updateShippingZone, 
  deleteShippingZone,
  saveBaseRegion,
  getBaseRegion,
  debugFixShippingZones
} from '@/services/shippingService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Edit, Save, X, Truck, MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShippingZones = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [newZone, setNewZone] = useState({
    name: '',
    region: '',
    baseRate: 0,
    isDefault: false,
    vendorRegion: '',
    additionalRates: []
  });
  const [showNewZoneForm, setShowNewZoneForm] = useState(false);
  const [newRateType, setNewRateType] = useState('weight');
  const [newRateThreshold, setNewRateThreshold] = useState(0);
  const [newRateFee, setNewRateFee] = useState(0);
  const [showBaseRegionModal, setShowBaseRegionModal] = useState(false);
  const [baseRegion, setBaseRegion] = useState('');
  const [savedBaseRegion, setSavedBaseRegion] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and has admin privileges
    if (!isAuthenticated || !user) {
      setAuthError(true);
      setLoading(false);
      toast.error('You must be logged in to access this page');
      navigate('/login');
      return;
    }

    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      setAuthError(true);
      setLoading(false);
      toast.error('Admin privileges required');
      navigate('/dashboard');
      return;
    }

    fetchZones();
    fetchBaseRegion();
  }, [isAuthenticated, user, navigate]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      
      // Try to get token from user object or localStorage
      let token = user?.token;
      
      if (!token) {
        console.log('Token not found in user object, checking localStorage...');
        token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No auth token available in user object or localStorage');
          setAuthError(true);
          setLoading(false);
          return;
        }
        
        console.log('Using token from localStorage');
      }
      
      console.log('Fetching zones with token...', token ? 'Token exists' : 'No token');
      const result = await getShippingZones(token);
      
      if (result.success) {
        // Ensure all zones use the correct base region for display purposes
        const processedZones = result.data.map(zone => ({
          ...zone,
          displayBaseRegion: savedBaseRegion // Add a special display property 
        }));
        
        setZones(processedZones);
        setAuthError(false);
        
        // If we have a base region but zones don't reflect it yet, offer to fix them
        const needsFixing = savedBaseRegion && 
          processedZones.some(zone => zone.vendorRegion !== savedBaseRegion);
        
        if (needsFixing) {
          console.log('Some zones need fixing - they have incorrect base regions');
          toast.info(
            'Some shipping zones have incorrect base regions. Click "Fix All Zones" to update them.',
            { duration: 5000 }
          );
        }
      } else {
        console.error('Failed to fetch zones:', result.message);
        toast.error(result.message || 'Error fetching shipping zones');
        if (result.message?.includes('Invalid or expired token')) {
          setAuthError(true);
        }
      }
    } catch (error) {
      console.error('Error fetching shipping zones:', error);
      toast.error('Error fetching shipping zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseRegion = async () => {
    try {
      const token = getToken();
      if (!token) {
        return;
      }
      
      const result = await getBaseRegion(token);
      
      if (result.success) {
        setSavedBaseRegion(result.baseRegion);
      }
    } catch (error) {
      console.error('Error fetching base region:', error);
    }
  };

  const getToken = () => {
    return user?.token || localStorage.getItem('token');
  };

  const handleSaveBaseRegion = async (e, inputValue = null) => {
    e.preventDefault();
    
    // Use the inputValue if provided, otherwise use baseRegion state
    const regionToSave = inputValue || baseRegion;
    
    if (!regionToSave.trim()) {
      toast.error('Please enter a base region');
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        toast.error('Authentication token missing');
        setAuthError(true);
        return;
      }
      
      const result = await saveBaseRegion(regionToSave, token);
      
      if (result.success) {
        toast.success('Base region saved successfully');
        setSavedBaseRegion(regionToSave);
        
        // Check if we should update all zones
        const updateAllZonesCheckbox = document.getElementById('updateAllZones');
        const shouldUpdateAllZones = updateAllZonesCheckbox && updateAllZonesCheckbox.checked;
        
        if (shouldUpdateAllZones) {
          // Update all existing zones with the new base region
          setLoading(true);
          try {
            // For each zone, update the vendorRegion to the new base region
            for (const zone of zones) {
              await updateShippingZone(
                zone._id, 
                { vendorRegion: regionToSave }, 
                token
              );
            }
            // Refresh the zones list
            await fetchZones();
            toast.success('All shipping zones updated with new base region');
          } catch (error) {
            console.error('Error updating shipping zones:', error);
            toast.error('Some shipping zones could not be updated');
          } finally {
            setLoading(false);
          }
        }
        
        setShowBaseRegionModal(false);
        setBaseRegion(''); // Reset the form state
      } else {
        toast.error(result.message || 'Error saving base region');
      }
    } catch (error) {
      console.error('Error saving base region:', error);
      toast.error('Error saving base region');
    }
  };

  const handleNewZoneSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = getToken();
      if (!token) {
        toast.error('Authentication token missing');
        setAuthError(true);
        return;
      }
      
      if (!savedBaseRegion) {
        toast.error('Please set your base region first');
        setShowBaseRegionModal(true);
        return;
      }
      
      // Use saved base region if available
      const zoneData = {
        ...newZone,
        // Always use the saved base region
        vendorRegion: savedBaseRegion
      };
      
      const result = await createShippingZone(zoneData, token);
      
      if (result.success) {
        toast.success('Shipping zone created successfully');
        setShowNewZoneForm(false);
        setNewZone({
          name: '',
          region: '',
          baseRate: 0,
          isDefault: false,
          vendorRegion: '',
          additionalRates: []
        });
        fetchZones();
      } else {
        toast.error(result.message || 'Error creating shipping zone');
      }
    } catch (error) {
      console.error('Error creating shipping zone:', error);
      toast.error('Error creating shipping zone');
    }
  };

  const handleUpdateZone = async (zoneId) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error('Authentication token missing');
        setAuthError(true);
        return;
      }
      
      // Ensure the base region is set correctly
      if (savedBaseRegion && (!editingZone.vendorRegion || editingZone.vendorRegion !== savedBaseRegion)) {
        editingZone.vendorRegion = savedBaseRegion;
      }
      
      // Extract only the data needed for the update to avoid sending the entire object with MongoDB fields
      // Removed sameRegionCapFee as we no longer use same region discount
      const updatedZoneData = {
        name: editingZone.name,
        region: editingZone.region,
        baseRate: editingZone.baseRate,
        isDefault: editingZone.isDefault,
        additionalRates: editingZone.additionalRates,
        vendorRegion: savedBaseRegion || editingZone.vendorRegion || editingZone.region
      };
      
      const result = await updateShippingZone(zoneId, updatedZoneData, token);
      
      if (result.success) {
        toast.success('Shipping zone updated successfully');
        setEditingZone(null);
        fetchZones();
      } else {
        toast.error(result.message || 'Error updating shipping zone');
      }
    } catch (error) {
      console.error('Error updating shipping zone:', error);
      toast.error('Error updating shipping zone');
    }
  };

  // Function to fix all shipping zones to use the correct base region
  const fixAllShippingZones = async () => {
    try {
      console.log("Starting fixAllShippingZones with base region:", savedBaseRegion);
      console.log("Current zones:", zones);
      
      if (!savedBaseRegion) {
        toast.error('Please set a base region first');
        return;
      }
      
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        toast.error('Authentication token missing');
        setAuthError(true);
        return;
      }
      
      // Update each zone
      let successCount = 0;
      let failCount = 0;
      
      for (const zone of zones) {
        console.log(`Processing zone: ${zone.name}, current vendorRegion: ${zone.vendorRegion}, target: ${savedBaseRegion}`);
        
        // Skip if the zone already has the correct base region
        if (zone.vendorRegion === savedBaseRegion) {
          console.log(`Zone ${zone.name} already has correct base region, skipping`);
          continue;
        }
        
        // Create a simplified update object
        const updateData = {
          vendorRegion: savedBaseRegion
        };
        
        console.log(`Updating zone ${zone.name} with data:`, updateData);
        
        try {
          const result = await updateShippingZone(zone._id, updateData, token);
          console.log(`Update result for zone ${zone.name}:`, result);
          successCount++;
        } catch (error) {
          console.error(`Error updating zone ${zone.name}:`, error);
          console.error("Error response:", error.response?.data);
          failCount++;
        }
      }
      
      toast.success(`Updated ${successCount} shipping zones with correct base region`);
      if (failCount > 0) {
        toast.error(`Failed to update ${failCount} shipping zones`);
      }
      
      // Refresh zones
      console.log("Refreshing zones after updates");
      await fetchZones();
    } catch (error) {
      console.error('Error fixing shipping zones:', error);
      toast.error('Error fixing shipping zones');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!confirm('Are you sure you want to delete this shipping zone?')) return;
    
    try {
      const token = getToken();
      if (!token) {
        toast.error('Authentication token missing');
        setAuthError(true);
        return;
      }
      
      const result = await deleteShippingZone(zoneId, token);
      
      if (result.success) {
        toast.success('Shipping zone deleted successfully');
        fetchZones();
      } else {
        toast.error(result.message || 'Error deleting shipping zone');
      }
    } catch (error) {
      console.error('Error deleting shipping zone:', error);
      toast.error('Error deleting shipping zone');
    }
  };

  const addAdditionalRate = () => {
    if (!newRateThreshold || !newRateFee) {
      toast.error('Please provide both threshold and fee values');
      return;
    }

    const newRate = {
      type: newRateType,
      threshold: parseFloat(newRateThreshold),
      additionalFee: parseFloat(newRateFee)
    };

    if (editingZone) {
      setEditingZone({
        ...editingZone,
        additionalRates: [...(editingZone.additionalRates || []), newRate]
      });
    } else {
      setNewZone({
        ...newZone,
        additionalRates: [...newZone.additionalRates, newRate]
      });
    }

    // Reset fields
    setNewRateType('weight');
    setNewRateThreshold(0);
    setNewRateFee(0);
  };

  const removeAdditionalRate = (index, isEditingZone = false) => {
    if (isEditingZone) {
      const updatedRates = [...editingZone.additionalRates];
      updatedRates.splice(index, 1);
      
      setEditingZone({
        ...editingZone,
        additionalRates: updatedRates
      });
    } else {
      const updatedRates = [...newZone.additionalRates];
      updatedRates.splice(index, 1);
      
      setNewZone({
        ...newZone,
        additionalRates: updatedRates
      });
    }
  };

  // Function to call the debug fix zones API
  const handleDebugFixZones = async () => {
    try {
      if (!savedBaseRegion) {
        toast.error('Please set a base region first');
        return;
      }
      
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        toast.error('Authentication token missing');
        setAuthError(true);
        return;
      }
      
      // Call our special debug endpoint
      console.log("Calling debug fix zones API...");
      const result = await debugFixShippingZones(savedBaseRegion, token);
      
      if (result.success) {
        toast.success(`Fixed ${result.message}`);
      } else {
        toast.error(result.message || 'Failed to fix zones');
      }
      
      // Refresh zones
      await fetchZones();
    } catch (error) {
      console.error('Error in debug fix zones:', error);
      toast.error('Error fixing zones');
    } finally {
      setLoading(false);
    }
  };

  // Base Region Modal
  const BaseRegionModal = () => {
    // Use local state for the input field to improve handling
    const [inputValue, setInputValue] = useState(baseRegion || '');
    
    // Handle input changes separately
    const handleInputChange = (e) => {
      setInputValue(e.target.value);
    };
    
    // Update parent state only on form submission
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!inputValue.trim()) {
        toast.error('Please enter a base region');
        return;
      }
      
      // Set the baseRegion state and submit the form
      setBaseRegion(inputValue);
      handleSaveBaseRegion(e, inputValue);
    };
    
    // Prevent modal clicks from bubbling up and causing focus issues
    const handleModalClick = (e) => {
      e.stopPropagation();
    };
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setShowBaseRegionModal(false)}
      >
        <div 
          className="bg-white rounded-lg p-6 w-full max-w-md"
          onClick={handleModalClick}
        >
          <h2 className="text-xl font-bold mb-4">Set Your Base Region</h2>
          <p className="text-sm text-gray-600 mb-4">
            This will be used as your default base region when creating shipping zones.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Base Region</label>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="e.g., Greater Accra"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
            
            <div className="mb-2 mt-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="updateAllZones" 
                  className="h-4 w-4 text-blue-600"
                  defaultChecked={true}
                />
                <label htmlFor="updateAllZones" className="ml-2 text-sm text-gray-700">
                  Update all existing shipping zones with this base region
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowBaseRegionModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Base Region
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipping Management</h1>
      </div>
      
      {/* Base Region Section */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Shipping Zones</h2>
          {savedBaseRegion && (
            <div className="text-sm text-gray-600 flex items-center mt-1">
              <MapPin size={14} className="mr-1" />
              Base Region: {savedBaseRegion}
            </div>
          )}
        </div>
        
        {!authError && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBaseRegionModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              <MapPin size={16} />
              <span>{savedBaseRegion ? 'Change Base Region' : 'Add Base Region'}</span>
            </button>
            
            <button
              onClick={() => setShowNewZoneForm(!showNewZoneForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              {showNewZoneForm ? (
                <>
                  <X size={16} />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Add Zone</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Base Region Modal */}
      {showBaseRegionModal && <BaseRegionModal />}

      {/* Authentication Error */}
      {authError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center text-red-700">
          <AlertTriangle className="h-5 w-5 mr-3" />
          <div>
            <h3 className="font-medium">Authentication Error</h3>
            <p className="text-sm">You don't have permission to access this page or your session has expired.</p>
            <button 
              className="text-red-700 p-0 text-sm mt-1 hover:underline"
              onClick={() => navigate('/login')}
            >
              Return to login
            </button>
          </div>
        </div>
      )}

      {/* New Zone Form - Only show if authenticated */}
      {!authError && showNewZoneForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Create New Shipping Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNewZoneSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Zone Name</label>
                  <Input
                    type="text"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    placeholder="e.g., Accra Metro"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Region</label>
                  <Input
                    type="text"
                    value={newZone.region}
                    onChange={(e) => setNewZone({ ...newZone, region: e.target.value })}
                    placeholder="e.g., Greater Accra"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The region where this shipping rate applies
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Base Rate (GHS)</label>
                  <Input
                    type="number"
                    value={newZone.baseRate}
                    onChange={(e) => setNewZone({ ...newZone, baseRate: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newZone.isDefault}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, isDefault: checked })}
                  id="default-zone"
                />
                <label htmlFor="default-zone" className="text-sm font-medium">
                  Set as default zone
                </label>
              </div>

              {/* Additional Rates */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold mb-3">Additional Rates</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={newRateType}
                      onChange={(e) => setNewRateType(e.target.value)}
                    >
                      <option value="weight">Weight-based</option>
                      <option value="price">Price-based</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {newRateType === 'weight' ? 'Min Weight (kg)' : 'Min Order Value (GHS)'}
                    </label>
                    <Input
                      type="number"
                      value={newRateThreshold}
                      onChange={(e) => setNewRateThreshold(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Additional Fee (GHS)
                    </label>
                    <Input
                      type="number"
                      value={newRateFee}
                      onChange={(e) => setNewRateFee(e.target.value)}
                      step="0.01"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addAdditionalRate}
                      className="h-8 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Rate
                    </button>
                  </div>
                </div>

                {/* Existing Additional Rates */}
                {newZone.additionalRates.length > 0 && (
                  <div className="border rounded-md p-3 mb-3">
                    <h4 className="text-sm font-medium mb-2">Configured Additional Rates</h4>
                    <ul className="space-y-2">
                      {newZone.additionalRates.map((rate, index) => (
                        <li key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span>
                            {rate.type === 'weight' 
                              ? `Weight ≥ ${rate.threshold}kg: ${rate.additionalFee > 0 ? '+' : ''}${rate.additionalFee} GHS` 
                              : `Order ≥ ${rate.threshold} GHS: ${rate.additionalFee > 0 ? '+' : ''}${rate.additionalFee} GHS`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAdditionalRate(index)}
                            className="h-7 w-7 p-0 flex items-center justify-center bg-transparent hover:bg-gray-200 rounded-full"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Create Shipping Zone
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Zones */}
      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : authError ? (
        null // Don't show zones if there's an auth error
      ) : zones.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Truck className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-800">No Shipping Zones</h3>
          <p className="text-gray-500 mt-1">
            Create your first shipping zone to start setting up delivery rates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map(zone => (
            <Card key={zone._id} className={`overflow-hidden ${zone.isDefault ? 'border-blue-400' : ''}`}>
              {zone.isDefault && (
                <div className="bg-blue-500 text-white py-1 px-3 text-xs font-medium text-center">
                  Default Zone
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    {editingZone && editingZone._id === zone._id ? (
                      <Input
                        type="text"
                        value={editingZone.name}
                        onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                        className="font-semibold"
                      />
                    ) : (
                      zone.name
                    )}
                  </CardTitle>
                  
                  <div className="flex space-x-2">
                    {editingZone && editingZone._id === zone._id ? (
                      <>
                        <button
                          onClick={() => setEditingZone(null)}
                          className="h-8 w-8 rounded-md flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                        >
                          <X size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleUpdateZone(zone._id)}
                          className="h-8 w-8 rounded-md flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                        >
                          <Save size={16} className="text-green-500" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingZone(zone)}
                          className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-50 hover:bg-blue-100"
                        >
                          <Edit size={16} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone._id)}
                          className="h-8 w-8 rounded-md flex items-center justify-center bg-red-50 hover:bg-red-100"
                          disabled={zone.isDefault}
                        >
                          <Trash2 size={16} className={zone.isDefault ? 'text-gray-300' : 'text-red-500'} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Delivery Region:</span>
                    <span className="font-medium">
                      {editingZone && editingZone._id === zone._id ? (
                        <Input
                          type="text"
                          value={editingZone.region}
                          onChange={(e) => setEditingZone({ ...editingZone, region: e.target.value })}
                          className="w-40 text-right"
                        />
                      ) : (
                        zone.region
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Your Base Region:</span>
                    <span className="font-medium">
                      {editingZone && editingZone._id === zone._id ? (
                        <Input
                          type="text"
                          value={editingZone.vendorRegion || savedBaseRegion}
                          onChange={(e) => setEditingZone({ ...editingZone, vendorRegion: e.target.value })}
                          className="w-40 text-right"
                        />
                      ) : (
                        zone.displayBaseRegion || savedBaseRegion || zone.vendorRegion
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Base Rate:</span>
                    <span className="font-medium">
                      {editingZone && editingZone._id === zone._id ? (
                        <Input
                          type="number"
                          value={editingZone.baseRate}
                          onChange={(e) => setEditingZone({ ...editingZone, baseRate: parseFloat(e.target.value) })}
                          min="0"
                          step="0.01"
                          className="w-24 text-right"
                        />
                      ) : (
                        `GHS ${zone.baseRate.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  
                  {/* Same Region Cap Fee section removed */}
                  
                  {editingZone && editingZone._id === zone._id && (
                    <>
                      {/* Same Region Cap Fee input field removed */}
                      <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-gray-500">Default Zone:</span>
                        <Switch
                          checked={editingZone.isDefault}
                          onCheckedChange={(checked) => setEditingZone({ ...editingZone, isDefault: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                {/* Additional Rates */}
                {(zone.additionalRates && zone.additionalRates.length > 0) || (editingZone && editingZone._id === zone._id) ? (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Additional Rates</h4>
                    
                    {editingZone && editingZone._id === zone._id && (
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <select
                          className="text-sm px-2 py-1 border border-gray-300 rounded-md"
                          value={newRateType}
                          onChange={(e) => setNewRateType(e.target.value)}
                        >
                          <option value="weight">Weight</option>
                          <option value="price">Price</option>
                        </select>
                        
                        <Input
                          type="number"
                          placeholder="Threshold"
                          value={newRateThreshold}
                          onChange={(e) => setNewRateThreshold(e.target.value)}
                          min="0"
                          step="0.01"
                          className="text-sm"
                        />
                        
                        <Input
                          type="number"
                          placeholder="Fee"
                          value={newRateFee}
                          onChange={(e) => setNewRateFee(e.target.value)}
                          step="0.01"
                          className="text-sm"
                        />
                        
                        <button
                          type="button"
                          onClick={addAdditionalRate}
                          className="h-8 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                    
                    <ul className="space-y-1 text-sm">
                      {editingZone && editingZone._id === zone._id
                        ? editingZone.additionalRates && editingZone.additionalRates.map((rate, index) => (
                            <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span>
                                {rate.type === 'weight' 
                                  ? `Weight ≥ ${rate.threshold}kg: ${rate.additionalFee > 0 ? '+' : ''}${rate.additionalFee} GHS` 
                                  : `Order ≥ ${rate.threshold} GHS: ${rate.additionalFee > 0 ? '+' : ''}${rate.additionalFee} GHS`}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAdditionalRate(index, true)}
                                className="h-7 w-7 p-0 flex items-center justify-center bg-transparent hover:bg-gray-200 rounded-full"
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </li>
                          ))
                        : zone.additionalRates && zone.additionalRates.map((rate, index) => (
                            <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span>
                                {rate.type === 'weight' 
                                  ? `Weight ≥ ${rate.threshold}kg: ${rate.additionalFee > 0 ? '+' : ''}${rate.additionalFee} GHS` 
                                  : `Order ≥ ${rate.threshold} GHS: ${rate.additionalFee > 0 ? '+' : ''}${rate.additionalFee} GHS`}
                              </span>
                            </li>
                          ))}
                    </ul>
                  </div>
                ) : null}
                
                {/* Add Save button at the bottom when in edit mode */}
                {editingZone && editingZone._id === zone._id && (
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingZone(null)}
                      className="mr-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateZone(zone._id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingZones; 